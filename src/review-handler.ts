import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createChildLogger } from "./logger.js";
import { runClaude } from "./claude.js";
import { GitHubClient } from "./github.js";
import type { Config, ReviewComment } from "./types.js";

const execFileAsync = promisify(execFile);
const log = createChildLogger("review-handler");

/** PR番号 → セッションID のマッピング（レビュー反復用） */
const sessionStore = new Map<number, string>();

export class ReviewHandler {
  private github: GitHubClient;
  private config: Config;
  private repoRoot: string;

  constructor(github: GitHubClient, config: Config, repoRoot: string) {
    this.github = github;
    this.config = config;
    this.repoRoot = repoRoot;
  }

  /** PRのレビューコメントに基づいて修正を行う */
  async handle(
    prNumber: number,
    comments: ReviewComment[],
    abortSignal: AbortSignal
  ): Promise<void> {
    log.info(
      { prNumber, commentCount: comments.length },
      "レビュー対応を開始"
    );

    const branchName = await this.github.getPRBranch(prNumber);
    const worktreePath = path.join(
      this.repoRoot,
      ".worktrees",
      `review-pr-${prNumber}`
    );

    try {
      // worktree を作成（既存ブランチをチェックアウト）
      await this.createWorktree(worktreePath, branchName);

      // コメントを投稿して修正開始を通知
      await this.github.postComment(
        prNumber,
        `🤖 レビューコメント（${comments.length}件）に基づいて修正を開始します。`
      );

      // プロンプトを構築
      const prompt = this.buildPrompt(comments);
      const sessionId = sessionStore.get(prNumber);

      // Claude Code で修正を実行
      const result = await runClaude({
        prompt,
        cwd: worktreePath,
        resumeSessionId: sessionId,
        allowedTools: this.config.claude.allowedTools.length > 0
          ? this.config.claude.allowedTools
          : undefined,
        abortSignal,
      });

      // セッションIDを保存（次回のレビュー対応用）
      if (result.sessionId) {
        sessionStore.set(prNumber, result.sessionId);
      }

      if (result.exitCode !== 0) {
        throw new Error(
          `Claude Code がエラーコード ${result.exitCode} で終了しました`
        );
      }

      // git push
      await execFileAsync("git", ["push", "origin", branchName], {
        cwd: worktreePath,
      });

      // 完了通知
      await this.github.postComment(
        prNumber,
        "✅ レビューコメントに基づく修正をプッシュしました。再度ご確認ください。"
      );

      log.info({ prNumber }, "レビュー対応が完了");
    } catch (err) {
      log.error({ err, prNumber }, "レビュー対応に失敗");

      await this.github
        .postComment(
          prNumber,
          `❌ レビュー対応に失敗しました。\n\n\`\`\`\n${err instanceof Error ? err.message : String(err)}\n\`\`\``
        )
        .catch(() => {});
    } finally {
      await this.removeWorktree(worktreePath).catch((err) => {
        log.warn({ err, worktreePath }, "worktreeの削除に失敗");
      });
    }
  }

  /** レビューコメントをプロンプトに変換 */
  private buildPrompt(comments: ReviewComment[]): string {
    const commentSection = comments
      .map((c) => {
        let loc = "";
        if (c.path) {
          loc = `\n**ファイル:** ${c.path}`;
          if (c.line) loc += `:${c.line}`;
        }
        return `### @${c.user} のコメント${loc}\n${c.body}`;
      })
      .join("\n\n---\n\n");

    return `あなたはPRのレビューコメントに基づいてコードを修正するエージェントです。

## レビューコメント

${commentSection}

## 指示

1. 各レビューコメントの内容を理解し、適切な修正を行ってください
2. CLAUDE.md が存在する場合はその指示に従ってください
3. 修正完了後、変更を git commit してください（git push は不要）
4. コミットメッセージは日本語で、\`fix:\` prefix をつけてください
5. レビュアーの意図が不明な場合は、最も合理的な解釈で実装してください`;
  }

  /** git worktree を作成（既存ブランチ用） */
  private async createWorktree(
    worktreePath: string,
    branchName: string
  ): Promise<void> {
    log.debug({ worktreePath, branchName }, "worktreeを作成中");

    // リモートの最新を取得
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
