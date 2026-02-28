import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createChildLogger } from "./logger.js";
import { runClaude } from "./claude.js";
import { GitHubClient } from "./github.js";
import type { Config, TrackedIssue, TaskContext } from "./types.js";

const execFileAsync = promisify(execFile);
const log = createChildLogger("task-handler");

const LABELS = {
  trigger: "auto-implement",
  inProgress: "auto-in-progress",
  failed: "auto-failed",
} as const;

export class TaskHandler {
  private github: GitHubClient;
  private config: Config;
  private repoRoot: string;

  constructor(github: GitHubClient, config: Config, repoRoot: string) {
    this.github = github;
    this.config = config;
    this.repoRoot = repoRoot;
  }

  /** Issue を受け取り、実装 → PR作成 まで実行する */
  async handle(issue: TrackedIssue, abortSignal: AbortSignal): Promise<void> {
    const branchName = `auto/issue-${issue.number}`;
    const worktreePath = path.join(
      this.repoRoot,
      ".worktrees",
      `issue-${issue.number}`
    );

    log.info(
      { issueNumber: issue.number, title: issue.title },
      "Issue実装を開始"
    );

    try {
      // ラベルを変更して開始を通知
      await this.github.removeLabel(issue.number, LABELS.trigger);
      await this.github.addLabel(issue.number, LABELS.inProgress);
      await this.github.postComment(
        issue.number,
        "🤖 自動実装を開始します。完了後にPRを作成します。"
      );

      // worktree を作成
      await this.createWorktree(worktreePath, branchName);

      const context: TaskContext = {
        issueNumber: issue.number,
        worktreePath,
        branchName,
        abortSignal,
      };

      // Claude Code で実装を実行
      const prompt = await this.buildPrompt(issue);
      const result = await runClaude({
        prompt,
        cwd: worktreePath,
        allowedTools: this.config.claude.allowedTools.length > 0
          ? this.config.claude.allowedTools
          : undefined,
        abortSignal,
      });

      if (result.exitCode !== 0) {
        throw new Error(
          `Claude Code がエラーコード ${result.exitCode} で終了しました`
        );
      }

      // git push
      await this.gitPush(context);

      // PR を作成
      const prBody = this.buildPRBody(issue, result.stdout, result.sessionId);
      const prNumber = await this.github.createPullRequest({
        title: `feat: #${issue.number} ${issue.title}`,
        body: prBody,
        head: branchName,
      });

      // Issue にPRリンクをコメント
      await this.github.postComment(
        issue.number,
        `✅ PRを作成しました: #${prNumber}\nセッションID: \`${result.sessionId ?? "N/A"}\``
      );

      // 完了ラベルを設定
      await this.github.removeLabel(issue.number, LABELS.inProgress);

      log.info(
        { issueNumber: issue.number, prNumber },
        "Issue実装が完了"
      );
    } catch (err) {
      log.error({ err, issueNumber: issue.number }, "Issue実装に失敗");

      // エラー報告
      await this.github.removeLabel(issue.number, LABELS.inProgress).catch(() => {});
      await this.github.addLabel(issue.number, LABELS.failed).catch(() => {});
      await this.github
        .postComment(
          issue.number,
          `❌ 自動実装に失敗しました。\n\n\`\`\`\n${err instanceof Error ? err.message : String(err)}\n\`\`\``
        )
        .catch(() => {});
    } finally {
      // worktree を削除
      await this.removeWorktree(worktreePath).catch((err) => {
        log.warn({ err, worktreePath }, "worktreeの削除に失敗");
      });
    }
  }

  /** Claude Code に渡すプロンプトを構築 */
  private async buildPrompt(issue: TrackedIssue): Promise<string> {
    let todoContent = "";
    try {
      todoContent = await readFile(
        path.join(this.repoRoot, "docs/todo/todo.md"),
        "utf-8"
      );
    } catch {
      // todo.md が存在しない場合は無視
    }

    return `あなたは GitHub Issue の内容に基づいてコードを実装するエージェントです。

## 実装対象の Issue

**タイトル:** ${issue.title}
**Issue番号:** #${issue.number}

**内容:**
${issue.body}

## 参考情報

このリポジトリの todo.md に現在のタスク一覧があります:
${todoContent ? `\n\`\`\`\n${todoContent}\n\`\`\`` : "（todo.md なし）"}

## 指示

1. Issue の内容を分析し、必要な実装を行ってください
2. CLAUDE.md が存在する場合はその指示に従ってください
3. テストが必要な場合はテストも作成してください
4. 実装完了後、変更を git commit してください（git push は不要）
5. コミットメッセージは日本語で、適切な prefix をつけてください

## 判断ポイント

実装中に迷った点や代替案がある場合は、以下の形式で標準出力に出力してください:
[DECISION_POINT] 迷った内容の説明 | 採用した選択肢 | 見送った選択肢`;
  }

  /** PR本文を構築 */
  private buildPRBody(
    issue: TrackedIssue,
    claudeOutput: string,
    sessionId?: string
  ): string {
    const decisionPoints = this.extractDecisionPoints(claudeOutput);

    return `## 概要

Closes #${issue.number}

Issue「${issue.title}」の自動実装PRです。

## 判断ポイント

${
  decisionPoints.length > 0
    ? decisionPoints
        .map(
          (dp, i) =>
            `### ${i + 1}. ${dp.description}\n- **採用:** ${dp.chosen}\n- **見送り:** ${dp.rejected}`
        )
        .join("\n\n")
    : "特になし"
}

## メタ情報

- 🤖 Claude Code による自動実装
- セッションID: \`${sessionId ?? "N/A"}\`

---
> レビューコメントを書くと、自動的に修正が行われます。`;
  }

  /** Claude の出力から判断ポイントを抽出 */
  private extractDecisionPoints(output: string): Array<{
    description: string;
    chosen: string;
    rejected: string;
  }> {
    const pattern = /\[DECISION_POINT\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+)/g;
    const points: Array<{
      description: string;
      chosen: string;
      rejected: string;
    }> = [];

    let match;
    while ((match = pattern.exec(output)) !== null) {
      points.push({
        description: match[1]!,
        chosen: match[2]!,
        rejected: match[3]!,
      });
    }

    return points;
  }

  /** git worktree を作成 */
  private async createWorktree(
    worktreePath: string,
    branchName: string
  ): Promise<void> {
    log.debug({ worktreePath, branchName }, "worktreeを作成中");

    // リモートに同名ブランチがあれば取得、なければ新規作成
    try {
      await execFileAsync("git", ["fetch", "origin", branchName], {
        cwd: this.repoRoot,
      });
      await execFileAsync(
        "git",
        ["worktree", "add", worktreePath, `origin/${branchName}`],
        { cwd: this.repoRoot }
      );
      // ローカルブランチとして追跡
      await execFileAsync(
        "git",
        ["checkout", "-B", branchName, `origin/${branchName}`],
        { cwd: worktreePath }
      );
    } catch {
      // リモートにブランチがない場合は新規作成
      await execFileAsync(
        "git",
        ["worktree", "add", "-b", branchName, worktreePath, "main"],
        { cwd: this.repoRoot }
      );
    }
  }

  /** git push を実行 */
  private async gitPush(context: TaskContext): Promise<void> {
    log.debug({ branchName: context.branchName }, "git pushを実行中");
    await execFileAsync(
      "git",
      ["push", "-u", "origin", context.branchName],
      { cwd: context.worktreePath }
    );
  }

  /** git worktree を削除 */
  private async removeWorktree(worktreePath: string): Promise<void> {
    log.debug({ worktreePath }, "worktreeを削除中");
    await execFileAsync(
      "git",
      ["worktree", "remove", worktreePath, "--force"],
      { cwd: this.repoRoot }
    );
  }
}
