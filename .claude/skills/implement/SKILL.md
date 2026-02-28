---
name: implement
description: "todo の先頭タスクを取得し、関連ドキュメントに基づいて実装・テスト・レビューまで行う"
user-invocable: true
argument-hint: "[タスクの指定（省略時は todo の先頭）]"
---

# タスク実装

引数として実装対象のタスクを受け取る（省略時は todo の先頭タスク）: `$ARGUMENTS`

## 手順

### 1. タスク取得

- `docs/todo/todo.md` を読み、先頭の未完了タスク（または `$ARGUMENTS` で指定されたタスク）を特定する
- 詳細ページ（`docs/todo/<slug>.md`）がリンクされている場合はそちらも読み込む

### 2. コンテキスト収集

- タスクに関連する specification（`docs/specifications/`）を特定・読み込む
- `steering/` 配下の最新ディレクトリがあれば `plan.md` / `tasklist.md` を確認する
- 関連するソースコードを Grep / Glob で調査する

### 3. 作業ログ準備

`steering/` に対応するディレクトリが未作成の場合:

- `steering/YYYY-MM-DD-<slug>/` を作成する
- `plan.md` に以下を記述する:
  - **対象 Specification**: どの `specifications/` のどの実装ステップに対応するか
  - **全体ロードマップにおける位置づけ**: `docs/roadmap.md` を参照し、プロジェクト全体の進捗と今回の作業の位置づけを明記
  - **目的・やること・影響範囲**
- `tasklist.md` にタスク一覧を記述する

### 4. 実装

- `tasklist.md` のタスクを順に消化する
- 実装に対応するテストも作成・更新する:
  - 単体テスト: `test/unit/*.test.ts`
  - E2E テスト: `test/e2e/*.spec.ts`

### 5. レビューサイクル

以下を順に実行する:

1. `/test` でテストを実行する
2. `/build-check` でビルド・Lint チェックを実施する
3. `/code-review` でコードレビューを実施する
4. 指摘事項があれば修正し、必要に応じて再度レビューする

### 6. 記録更新

- specification の該当ステップにチェックを入れる
- `docs/todo/todo.md` から完了したタスクの行を削除する（詳細ページがあればそちらも削除する）
- `docs/progress.md` を更新する（必要に応じて）
- `steering/YYYY-MM-DD-<slug>/knowledge.md` に学びを記録する

### 7. 完了報告

- 実施内容をユーザーに報告する
- `/commit-push` でコミットするか案内する

## 注意事項

- 日本語で記述する
- 1回の実行で1タスクを完了させることを目指す
- テストが通らない場合はブロッカーとして `steering/` の `blocker.md` に記録し、ユーザーに報告する
- todo の全タスクが完了したら `docs/todo/` ディレクトリごと削除する
