---
name: docs-review
description: docs/配下の全ドキュメントの整合性を確認し、必要な修正を行う
user-invocable: true
---

# ドキュメント整合性レビュー

## 概要

`docs/` 配下の全ドキュメントを調査し、コードの現状との整合性を確認・修正する。

## 手順

### 1. 全ドキュメント読み込み

以下を全て読み込む:
- `docs/prd.md` および `docs/prd-enhance-*.md`
- `docs/roadmap.md`
- `docs/progress.md`
- `docs/specifications/` 配下の全ファイル
- `docs/architecture/architecture.md`
- `docs/development-guidelines.md`
- `docs/architecture/adrs/` 配下の全ファイル

### 2. コードとの整合性チェック

- `src/` 配下のコードを確認し、`architecture/architecture.md` の記述と一致しているか
- `package.json` の依存関係と `development-guidelines.md` の技術スタック記述が一致しているか
- `specifications/` の受入条件が実際の実装と一致しているか

### 3. ドキュメント間の整合性チェック

- `prd.md` の機能要件に対応する specification が存在するか
- `progress.md` の状態が実際の開発状況と一致しているか
- `roadmap.md` の構想が最新の議論を反映しているか
- `specifications/` のPRD参照が正しいか

### 4. 修正実行

- 不整合を発見した場合、修正内容をユーザーに提示してから修正する
- 大きな変更が必要な場合はユーザーに確認する

### 5. レポート

修正した内容と残課題をユーザーに報告する。

### 6. todo 更新

- レビューで発見した不整合の修正タスクを `docs/todo/todo.md` に追加する（必要な場合）

## 注意事項

- 日本語で記述する
- 既存の記述を尊重し、最小限の修正にとどめる
- 判断に迷う場合はユーザーに確認する
- このスキルではソースコードの実装・変更は行わない。ドキュメントの更新のみに留める
