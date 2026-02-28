import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";
import { createChildLogger } from "./logger.js";
import type { Config, TrackedIssue, ReviewComment } from "./types.js";

const log = createChildLogger("github");

const RetryOctokit = Octokit.plugin(retry);

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: Config) {
    this.octokit = new RetryOctokit({ auth: config.github.token });
    this.owner = config.github.owner;
    this.repo = config.github.repo;
  }

  /** auto-implement ラベル付きのオープンIssueを取得 */
  async fetchLabeledIssues(label: string): Promise<TrackedIssue[]> {
    log.debug({ label }, "ラベル付きIssueを取得中");
    const { data } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      labels: label,
      state: "open",
      per_page: 10,
    });

    // PRを除外（GitHub APIではIssueとPRが同じエンドポイント）
    return data
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body ?? "",
        labels: issue.labels
          .map((l) => (typeof l === "string" ? l : l.name ?? ""))
          .filter(Boolean),
      }));
  }

  /** 指定日時以降のレビューコメントがある auto/ ブランチのPRを取得 */
  async fetchReviewComments(since: string): Promise<ReviewComment[]> {
    log.debug({ since }, "レビューコメントを取得中");
    const { data: prs } = await this.octokit.pulls.list({
      owner: this.owner,
      repo: this.repo,
      state: "open",
      per_page: 30,
    });

    const autoPRs = prs.filter((pr) => pr.head.ref.startsWith("auto/"));
    const comments: ReviewComment[] = [];

    for (const pr of autoPRs) {
      const { data: reviewComments } =
        await this.octokit.pulls.listReviewComments({
          owner: this.owner,
          repo: this.repo,
          pull_number: pr.number,
          since,
          per_page: 100,
        });

      // bot自身のコメントは除外
      const humanComments = reviewComments.filter(
        (c) => c.user?.type !== "Bot"
      );

      for (const c of humanComments) {
        comments.push({
          id: c.id,
          prNumber: pr.number,
          body: c.body,
          user: c.user?.login ?? "unknown",
          path: c.path,
          line: c.line ?? undefined,
          createdAt: c.created_at,
        });
      }

      // Issue コメント（PR の会話タブ）も取得
      const { data: issueComments } = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: pr.number,
        since,
        per_page: 100,
      });

      const humanIssueComments = issueComments.filter(
        (c) => c.user?.type !== "Bot"
      );

      for (const c of humanIssueComments) {
        comments.push({
          id: c.id,
          prNumber: pr.number,
          body: c.body ?? "",
          user: c.user?.login ?? "unknown",
          createdAt: c.created_at,
        });
      }
    }

    return comments;
  }

  /** PRを作成 */
  async createPullRequest(params: {
    title: string;
    body: string;
    head: string;
    base?: string;
  }): Promise<number> {
    log.info({ head: params.head }, "PRを作成中");
    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base ?? "main",
    });
    log.info({ prNumber: data.number }, "PR作成完了");
    return data.number;
  }

  /** Issueまたは PR にコメントを投稿 */
  async postComment(issueNumber: number, body: string): Promise<void> {
    log.debug({ issueNumber }, "コメントを投稿中");
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });
  }

  /** ラベルを追加 */
  async addLabel(issueNumber: number, label: string): Promise<void> {
    log.debug({ issueNumber, label }, "ラベルを追加中");
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: [label],
    });
  }

  /** ラベルを削除 */
  async removeLabel(issueNumber: number, label: string): Promise<void> {
    log.debug({ issueNumber, label }, "ラベルを削除中");
    try {
      await this.octokit.issues.removeLabel({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        name: label,
      });
    } catch (err: unknown) {
      // ラベルが存在しない場合は無視
      if (err instanceof Error && "status" in err && (err as { status: number }).status === 404) {
        log.debug({ issueNumber, label }, "ラベルが存在しないため削除をスキップ");
        return;
      }
      throw err;
    }
  }

  /** Issue をクローズ */
  async closeIssue(issueNumber: number): Promise<void> {
    log.debug({ issueNumber }, "Issueをクローズ中");
    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state: "closed",
    });
  }

  /** PRのブランチ名を取得 */
  async getPRBranch(prNumber: number): Promise<string> {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });
    return data.head.ref;
  }
}
