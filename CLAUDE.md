# CLAUDE.md — エージェント向け行動規範

## プロジェクト概要

このリポジトリは「自律開発オーケストレータ」です。GitHub Issue を監視し、Claude Code CLI で自動実装 → PR作成を行います。

## 開発ルール

### 言語

- 会話・コミットメッセージ・コメント・ドキュメント: 日本語
- 変数名・関数名・型名・ファイル名: 英語
- コミットメッセージ: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:` + 日本語

### コーディング規約

- TypeScript strict mode
- ESM（`"type": "module"`）
- Node.js 22 ターゲット
- インポートには `.js` 拡張子を付ける（ESM互換）

### Git

- main ブランチに直接コミット（通常開発時）
- auto/ ブランチはオーケストレータが自動生成するPR用

### テスト

- テストは変更に対して適切に作成する
- テストが通ることを確認してからコミットする

## ディレクトリ構成

```
src/
├── index.ts           # エントリポイント
├── config.ts          # 環境変数の読み込み
├── logger.ts          # pino ベースのロガー
├── types.ts           # 型定義
├── github.ts          # GitHub API クライアント
├── poller.ts          # ポーリングループ
├── claude.ts          # Claude Code CLI 実行ラッパー
├── worker-pool.ts     # 並列タスク管理
├── task-handler.ts    # Issue実装フロー
└── review-handler.ts  # PRレビュー対応フロー
```

## タスク管理

- `docs/todo/todo.md` に現在のタスク一覧がある
- 実装時はこのファイルを参照して文脈を把握する
