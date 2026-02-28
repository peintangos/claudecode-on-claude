import { spawn } from "node:child_process";
import { createChildLogger } from "./logger.js";
import type { ClaudeResult } from "./types.js";

const log = createChildLogger("claude");

export interface ClaudeRunOptions {
  prompt: string;
  cwd: string;
  resumeSessionId?: string;
  allowedTools?: string[];
  abortSignal?: AbortSignal;
}

/**
 * Claude Code CLI をヘッドレスモードで実行する。
 * `claude -p` で非対話的に実行し、結果を返す。
 */
export async function runClaude(
  options: ClaudeRunOptions
): Promise<ClaudeResult> {
  const { prompt, cwd, resumeSessionId, allowedTools, abortSignal } = options;

  const args = ["-p", prompt, "--output-format", "json"];

  if (resumeSessionId) {
    args.push("--resume", resumeSessionId);
  }

  if (allowedTools && allowedTools.length > 0) {
    for (const tool of allowedTools) {
      args.push("--allowedTools", tool);
    }
  }

  log.info(
    {
      cwd,
      hasResume: !!resumeSessionId,
      promptLength: prompt.length,
    },
    "Claude Code CLI を実行中"
  );

  return new Promise<ClaudeResult>((resolve, reject) => {
    const child = spawn("claude", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    const onAbort = () => {
      log.warn("Claude Code CLI の実行がキャンセルされました");
      child.kill("SIGTERM");
    };

    if (abortSignal) {
      if (abortSignal.aborted) {
        child.kill("SIGTERM");
        reject(new Error("実行前にキャンセルされました"));
        return;
      }
      abortSignal.addEventListener("abort", onAbort, { once: true });
    }

    child.on("close", (code) => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", onAbort);
      }

      const exitCode = code ?? 1;
      const sessionId = extractSessionId(stdout);

      log.info(
        { exitCode, sessionId, stdoutLength: stdout.length },
        "Claude Code CLI 実行完了"
      );

      resolve({ exitCode, stdout, stderr, sessionId });
    });

    child.on("error", (err) => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", onAbort);
      }
      log.error({ err }, "Claude Code CLI の起動に失敗");
      reject(err);
    });
  });
}

/**
 * Claude Code の JSON 出力からセッションIDを抽出する。
 * 出力は JSON Lines 形式（複数のJSONオブジェクトが改行区切り）で、
 * 最後のオブジェクトに session_id が含まれる。
 */
function extractSessionId(stdout: string): string | undefined {
  try {
    // JSON出力の最後の行を取得
    const lines = stdout.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return undefined;

    const lastLine = lines[lines.length - 1]!;
    const parsed = JSON.parse(lastLine) as Record<string, unknown>;
    if (typeof parsed.session_id === "string") {
      return parsed.session_id;
    }

    // session_id が最後の行にない場合、全行を逆順に探索
    for (let i = lines.length - 2; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]!) as Record<string, unknown>;
        if (typeof obj.session_id === "string") {
          return obj.session_id;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // パースに失敗した場合はundefinedを返す
  }
  return undefined;
}
