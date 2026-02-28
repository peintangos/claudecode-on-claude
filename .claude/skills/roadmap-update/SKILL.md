---
name: roadmap-update
description: roadmap.mdとprogress.mdを最新の開発状況に更新する
user-invocable: true
---

# ロードマップ・進捗更新

## 概要

`docs/roadmap.md`（構想・計画）と `docs/progress.md`（開発進捗）を最新状態に更新する。

## 手順

### 1. 現状把握

以下を全て読み込む:
- `docs/roadmap.md`
- `docs/progress.md`
- `docs/specifications/` 配下の全ファイル
- `steering/` 配下の最新の作業ログ（特に tasklist.md と knowledge.md）

### 2. progress.md 更新

- 各specificationの完了状況を確認し、状態を更新する
  - 📋 計画中: specificationは作成済みだが未着手
  - ⚠️ 開発中: 開発進行中
  - ✅ 完了: 全受入条件を満たし完了
- 完了日、備考を更新する
- 新しいspecificationがあれば追加する

### 3. roadmap.md 更新

- 構想・計画に変更があれば反映する
- 新しいエンハンスや方針変更があれば追記する
- 完了したマイルストンには完了マークを付ける

### 4. 変更内容の報告

更新した内容をユーザーに報告する。

### 5. todo 更新

- ロードマップの変更に伴い、`docs/todo/todo.md` に新規タスクの追加や既存タスクの修正が必要であれば反映する

## 注意事項

- 日本語で記述する
- progress.md は事実ベースで記載（推測しない）
- roadmap.md は構想・計画のみ。詳細な進捗は progress.md に記載する
- このスキルではソースコードの実装・変更は行わない。ドキュメントの更新のみに留める
