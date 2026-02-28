# claudecode-on-claude

GitHub Issue を監視し、Claude Code CLI で自動実装 → PR 作成を行う自律開発オーケストレータ。

## アーキテクチャ

### 全体フロー

```
GitHub Issue (auto-implement ラベル)
        │
        ▼
   Poller（定期ポーリング）
        │
        ├─ Issue 検知 ──────► WorkerPool ──► TaskHandler
        │                                       │
        │                                  ① ラベル変更 (trigger → in-progress)
        │                                  ② git worktree 作成 (auto/issue-N ブランチ)
        │                                  ③ Claude Code CLI で実装
        │                                  ④ git push → PR 作成
        │                                  ⑤ worktree 削除
        │
        └─ レビューコメント検知 ─► WorkerPool ──► ReviewHandler
                                                    │
                                               ① git worktree 作成 (PRブランチ)
                                               ② Claude Code CLI で修正
                                               ③ git push → 完了コメント
                                               ④ worktree 削除
```

### コンポーネント構成

| コンポーネント | 役割 |
|---|---|
| `Poller` | 設定インターバルで GitHub をポーリング。`auto-implement` ラベル付き Issue と PR レビューコメントを検知する |
| `WorkerPool` | 並列タスク管理。`maxConcurrency` 設定で同時実行数を制限し、重複実行を防ぐ |
| `TaskHandler` | Issue 実装フロー。git worktree 作成 → Claude Code 実行 → PR 作成までを担う |
| `ReviewHandler` | PR レビュー対応フロー。コメント内容を Claude Code に渡し、修正をプッシュする |
| `GitHubClient` | GitHub REST API のラッパー。Issue/PR/ラベル操作を行う |
| `runClaude` | Claude Code CLI (`claude`) のプロセス実行ラッパー。セッション継続も対応 |

### Issue 自動実装の詳細フロー

1. Issue に `auto-implement` ラベルを付与
2. Poller が検知し、WorkerPool 経由で TaskHandler を起動
3. ラベルを `auto-in-progress` に変更し、Issue にコメントを投稿
4. `auto/issue-<番号>` ブランチで git worktree を作成
5. Issue タイトル・本文を含むプロンプトで Claude Code CLI を実行
6. Claude Code がコードを実装し、変更を `git commit`
7. `git push` 後に PR を自動作成（判断ポイントも PR 本文に記載）
8. Issue に PR リンクをコメント、`auto-in-progress` ラベルを削除
9. エラー時は `auto-failed` ラベルを付与してエラー内容をコメント

### PR レビュー自動対応の詳細フロー

1. `auto/issue-<番号>` PR にレビューコメントを投稿
2. Poller がコメントを検知し、ReviewHandler を起動
3. PR ブランチで git worktree を作成
4. レビューコメントを含むプロンプトで Claude Code CLI を実行（セッション継続対応）
5. 修正を `git push` し、完了コメントを投稿

## 使い方

### 前提条件

- Node.js 22+
- Claude Code CLI (`claude`) がインストール済み
- GitHub Personal Access Token（Issues・PRへの読み書き権限）

### セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO などを設定
```

### 起動

```bash
npm start
```

### Issue の自動実装を依頼する

1. 実装してほしい内容を GitHub Issue として作成
2. Issue に `auto-implement` ラベルを付与
3. オーケストレータが自動的に実装 → PR 作成を行う

## 開発

このプロジェクトの devcontainer は [Claude Code](https://docs.anthropic.com/en/docs/claude-code) での開発用に設計されている。

VS Code でこのプロジェクトを開き、「Reopen in Container」を選択した後:

```bash
# ターミナルで Claude Code を起動
claude
```

初回起動時はブラウザ経由で認証が求められる（VS Code が自動的にURLを転送する）。

```bash
# ビルド
npm run build

# 開発モード（ watch）
npm run dev
```
