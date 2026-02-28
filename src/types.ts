export interface Config {
  github: {
    token: string;
    owner: string;
    repo: string;
  };
  polling: {
    intervalMs: number;
  };
  worker: {
    maxConcurrency: number;
  };
  claude: {
    allowedTools: string[];
  };
}

export interface TrackedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

export interface ReviewComment {
  id: number;
  prNumber: number;
  body: string;
  user: string;
  path?: string;
  line?: number;
  createdAt: string;
}

export interface PRInfo {
  number: number;
  branchName: string;
  sessionId?: string;
}

export interface ClaudeResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  sessionId?: string;
}

export interface TaskContext {
  issueNumber: number;
  worktreePath: string;
  branchName: string;
  abortSignal: AbortSignal;
}

export type TaskStatus = "pending" | "in-progress" | "completed" | "failed";

export interface WorkerTask {
  id: string;
  type: "issue" | "review";
  issueNumber: number;
  prNumber?: number;
  status: TaskStatus;
  abortController: AbortController;
}
