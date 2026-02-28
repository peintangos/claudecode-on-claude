import { resolve } from "node:path";
import { loadConfig } from "./config.js";
import { logger, createChildLogger } from "./logger.js";
import { GitHubClient } from "./github.js";
import { WorkerPool } from "./worker-pool.js";
import { TaskHandler } from "./task-handler.js";
import { ReviewHandler } from "./review-handler.js";
import { Poller } from "./poller.js";

const log = createChildLogger("main");

async function main(): Promise<void> {
  log.info("🚀 自律開発オーケストレータを起動中...");

  // 設定を読み込み
  const config = loadConfig();
  log.info(
    {
      repo: `${config.github.owner}/${config.github.repo}`,
      pollingInterval: config.polling.intervalMs,
      maxConcurrency: config.worker.maxConcurrency,
    },
    "設定を読み込み完了"
  );

  // リポジトリのルートパスを特定
  const repoRoot = resolve(process.cwd());

  // コンポーネントを初期化
  const github = new GitHubClient(config);
  const workerPool = new WorkerPool(config.worker.maxConcurrency);
  const taskHandler = new TaskHandler(github, config, repoRoot);
  const reviewHandler = new ReviewHandler(github, config, repoRoot);
  const poller = new Poller(
    github,
    workerPool,
    taskHandler,
    reviewHandler,
    config
  );

  // Graceful shutdown のセットアップ
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    log.info({ signal }, "シャットダウンシグナルを受信");

    // ポーリングを停止
    poller.stop();

    // 実行中のタスクの完了を待つ（最大30秒）
    log.info("実行中のタスクの完了を待機中...");
    await workerPool.waitForAll(30_000);

    log.info("シャットダウン完了");
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // ポーリングを開始
  poller.start();

  log.info("オーケストレータが稼働中です");
}

main().catch((err) => {
  logger.fatal({ err }, "オーケストレータの起動に失敗");
  process.exit(1);
});
