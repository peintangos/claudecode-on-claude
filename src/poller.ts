import { createChildLogger } from "./logger.js";
import { GitHubClient } from "./github.js";
import { WorkerPool } from "./worker-pool.js";
import { TaskHandler } from "./task-handler.js";
import { ReviewHandler } from "./review-handler.js";
import type { Config } from "./types.js";

const log = createChildLogger("poller");

export class Poller {
  private github: GitHubClient;
  private workerPool: WorkerPool;
  private taskHandler: TaskHandler;
  private reviewHandler: ReviewHandler;
  private config: Config;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastPollTime: string;

  constructor(
    github: GitHubClient,
    workerPool: WorkerPool,
    taskHandler: TaskHandler,
    reviewHandler: ReviewHandler,
    config: Config
  ) {
    this.github = github;
    this.workerPool = workerPool;
    this.taskHandler = taskHandler;
    this.reviewHandler = reviewHandler;
    this.config = config;
    this.lastPollTime = new Date().toISOString();
  }

  /** ポーリングを開始 */
  start(): void {
    log.info(
      { intervalMs: this.config.polling.intervalMs },
      "ポーリングを開始"
    );

    // 初回は即時実行
    void this.poll();

    this.timer = setInterval(() => {
      void this.poll();
    }, this.config.polling.intervalMs);
  }

  /** ポーリングを停止 */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      log.info("ポーリングを停止");
    }
  }

  /** 1回のポーリングサイクル */
  private async poll(): Promise<void> {
    log.debug("ポーリングサイクルを開始");

    try {
      await this.pollIssues();
      await this.pollReviewComments();
      this.lastPollTime = new Date().toISOString();
    } catch (err) {
      log.error({ err }, "ポーリングサイクルでエラーが発生");
    }
  }

  /** auto-implement ラベル付きIssueをポーリング */
  private async pollIssues(): Promise<void> {
    const issues = await this.github.fetchLabeledIssues("auto-implement");

    if (issues.length === 0) {
      log.debug("新しいIssueはありません");
      return;
    }

    log.info({ count: issues.length }, "auto-implement Issueを検知");

    for (const issue of issues) {
      const taskId = `issue-${issue.number}`;

      if (this.workerPool.has(taskId)) {
        log.debug({ taskId }, "タスクは既に処理中");
        continue;
      }

      if (!this.workerPool.canAccept) {
        log.warn("ワーカープールが満杯。次のサイクルでリトライ");
        break;
      }

      await this.workerPool.submit(
        taskId,
        "issue",
        issue.number,
        (abortSignal) => this.taskHandler.handle(issue, abortSignal)
      );
    }
  }

  /** PRのレビューコメントをポーリング */
  private async pollReviewComments(): Promise<void> {
    const comments = await this.github.fetchReviewComments(this.lastPollTime);

    if (comments.length === 0) {
      log.debug("新しいレビューコメントはありません");
      return;
    }

    // PR番号ごとにグループ化
    const byPR = new Map<number, typeof comments>();
    for (const comment of comments) {
      const existing = byPR.get(comment.prNumber) ?? [];
      existing.push(comment);
      byPR.set(comment.prNumber, existing);
    }

    for (const [prNumber, prComments] of byPR) {
      const taskId = `review-${prNumber}-${Date.now()}`;

      if (!this.workerPool.canAccept) {
        log.warn("ワーカープールが満杯。次のサイクルでリトライ");
        break;
      }

      await this.workerPool.submit(
        taskId,
        "review",
        prComments[0]!.prNumber,
        (abortSignal) =>
          this.reviewHandler.handle(prNumber, prComments, abortSignal),
        prNumber
      );
    }
  }
}
