# 自律開発オーケストレータの構築

## 目的

AWS EC2上で動くNode.jsオーケストレータを構築する。GitHub Issueを監視し、Claude Code CLIをヘッドレスモードで実行して実装→PR作成を自律的に行う。

## やること

1. TypeScript基盤セットアップ
2. 基盤モジュール（config, logger, types）
3. GitHub APIクライアント（Octokit）
4. Claude Code CLI実行ラッパー
5. Issue実装ハンドラー（worktree → Claude → PR）
6. ポーリング・ワーカープール・エントリポイント
7. PRレビュー対応ハンドラー
8. CLAUDE.md + Dockerfile + docker-compose.yml

## 影響範囲

- プロジェクト全体の再構成（index.js → TypeScript src/）
- 新規ファイル約10個
- 既存の .devcontainer は変更なし
