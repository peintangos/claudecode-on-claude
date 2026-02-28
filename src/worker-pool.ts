import { createChildLogger } from "./logger.js";
import type { WorkerTask, TaskStatus } from "./types.js";

const log = createChildLogger("worker-pool");

export class WorkerPool {
  private tasks: Map<string, WorkerTask> = new Map();
  private maxConcurrency: number;

  constructor(maxConcurrency: number) {
    this.maxConcurrency = maxConcurrency;
  }

  /** 現在実行中のタスク数 */
  get activeCount(): number {
    return [...this.tasks.values()].filter(
      (t) => t.status === "in-progress"
    ).length;
  }

  /** 新しいタスクを受け入れ可能か */
  get canAccept(): boolean {
    return this.activeCount < this.maxConcurrency;
  }

  /** タスクが既に存在するか（重複実行防止） */
  has(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    return !!task && (task.status === "in-progress" || task.status === "pending");
  }

  /** タスクを登録して実行する */
  async submit(
    taskId: string,
    type: "issue" | "review",
    issueNumber: number,
    handler: (abortSignal: AbortSignal) => Promise<void>,
    prNumber?: number
  ): Promise<void> {
    if (!this.canAccept) {
      log.warn(
        { taskId, activeCount: this.activeCount, maxConcurrency: this.maxConcurrency },
        "ワーカープールが満杯のためタスクをスキップ"
      );
      return;
    }

    if (this.has(taskId)) {
      log.debug({ taskId }, "タスクは既に実行中");
      return;
    }

    const abortController = new AbortController();
    const task: WorkerTask = {
      id: taskId,
      type,
      issueNumber,
      prNumber,
      status: "in-progress",
      abortController,
    };

    this.tasks.set(taskId, task);
    log.info(
      { taskId, type, issueNumber, activeCount: this.activeCount },
      "タスクを開始"
    );

    // 非同期で実行（awaitしない）
    handler(abortController.signal)
      .then(() => {
        this.updateStatus(taskId, "completed");
      })
      .catch((err) => {
        log.error({ err, taskId }, "タスクの実行に失敗");
        this.updateStatus(taskId, "failed");
      });
  }

  private updateStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      log.info({ taskId, status }, "タスクのステータスを更新");
    }
  }

  /** 全タスクをキャンセル */
  cancelAll(): void {
    log.info("全タスクをキャンセル中");
    for (const task of this.tasks.values()) {
      if (task.status === "in-progress") {
        task.abortController.abort();
        task.status = "failed";
      }
    }
  }

  /** 全タスクの完了を待つ（graceful shutdown用） */
  async waitForAll(timeoutMs: number = 30_000): Promise<void> {
    const activeTasks = [...this.tasks.values()].filter(
      (t) => t.status === "in-progress"
    );

    if (activeTasks.length === 0) return;

    log.info(
      { activeCount: activeTasks.length },
      "アクティブなタスクの完了を待機中"
    );

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const stillActive = [...this.tasks.values()].filter(
        (t) => t.status === "in-progress"
      );
      if (stillActive.length === 0) return;
      await new Promise((r) => setTimeout(r, 1000));
    }

    log.warn("タイムアウト: 残りのタスクをキャンセル");
    this.cancelAll();
  }
}
