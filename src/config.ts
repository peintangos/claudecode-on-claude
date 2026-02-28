import type { Config } from "./types.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

export function loadConfig(): Config {
  const repo = requireEnv("GITHUB_REPO"); // "owner/repo" 形式
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    throw new Error(
      "GITHUB_REPO は 'owner/repo' 形式で指定してください"
    );
  }

  return {
    github: {
      token: requireEnv("GITHUB_TOKEN"),
      owner,
      repo: repoName,
    },
    polling: {
      intervalMs: parseInt(process.env["POLLING_INTERVAL_MS"] ?? "60000", 10),
    },
    worker: {
      maxConcurrency: parseInt(process.env["MAX_CONCURRENCY"] ?? "3", 10),
    },
    claude: {
      allowedTools: (process.env["CLAUDE_ALLOWED_TOOLS"] ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    },
  };
}
