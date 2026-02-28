---
name: catchup
description: "セッション開始時にプロジェクトの現状を要約し、次のアクションを提案する"
user_invocable: true
context: fork
agent: catchup-reporter
---

# キャッチアップ

以下の手順でプロジェクトの現状を要約し、次のアクションを提案せよ。

## 1. TODO 確認

`docs/todo.md` が存在する場合は Read で読み込み、次にやるべきタスクを把握する。

## 2. PRD 読み込み

`docs/prd.md` を Read で読み込み、プロジェクトの全体像を把握する。`docs/prd-enhance-*.md` が存在する場合はそれも読み込む。

## 3. 進捗・ロードマップ読み込み

`docs/progress.md` と `docs/roadmap.md` を Read で読み込み、現在のマイルストーン進捗を把握する。

## 4. Specification 状況確認

`docs/specifications/` 配下のファイルを Glob で一覧取得し、各仕様書を Read で読み込む。実装ステップのチェックボックス（`- [x]` / `- [ ]`）を集計し、各仕様の完了状況を把握する。

## 5. 最新作業ログ確認

`steering/` 配下のディレクトリを Glob で一覧取得し、最新のディレクトリ（日付順で最後のもの）を特定する。そのディレクトリ内の `plan.md`, `tasklist.md`, `knowledge.md`, `blocker.md` を Read で読み込む。

## 6. 会話記録確認

`CONVERSATION_CHRONICLE.md` が存在する場合は Read で読み込み、直近のセッション内容を把握する。

## 7. 要約と提案の出力

以下のフォーマットで結果を出力する:

```markdown
## キャッチアップ

### プロジェクト概要
[PRD から1-2行で要約]

### 前回までの成果
- [直近の作業ログや会話記録から抽出]

### 現在の進捗
| マイルストーン | ステータス | 備考 |
|---|---|---|
| M1 | ✅ / ⚠️ / 📋 | ... |

### 未解決のブロッカー
- [blocker.md や specification から抽出。なければ「なし」]

### 次のアクション（提案）
1. [最優先: todo.md の先頭タスク、または次の未着手 specification のステップ]
2. [その次]

### 前回の学び
- [knowledge.md から主要な学びを抽出。なければ「なし」]
```
