---
paths:
  - "docs/**"
---

# ドキュメント編集ルール

## 四層構造
- `prd.md` / `prd-enhance-*.md` — プロダクト要件定義
- `specifications/YYYY-MM-DD-slug.md` — 機能仕様（Gherkin 形式）
- `roadmap.md` — 構想・計画
- `progress.md` — specification の完了状況
- `todo/todo.md` — 作業キュー（次にやるべきことの優先度順リスト。存在しない場合もある）
- `todo/<slug>.md` — タスクの詳細ページ（必要な場合のみ。todo.md からリンク）

## 作業完了時の更新チェックリスト
- [ ] `progress.md` の specification 完了状況
- [ ] 関連する `specifications/` の受入条件・実装ステップ
- [ ] 構造変更があれば `architecture/architecture.md`
- [ ] 重要な意思決定があれば `architecture/adrs/YYYY-MM-DD-slug.md`
- [ ] 構想・計画に影響があれば `roadmap.md`
- [ ] `docs/todo/todo.md` の完了タスク削除（全タスク完了ならディレクトリ削除）

## README.md
- PRD 作成時に README.md の概要セクションを更新する（詳細は `docs/prd.md` を参照する形）
- 技術スタック変更時に README.md の該当セクションも更新する

## その他
- `architecture/adrs/` は追記のみ。過去の記録は変更しない
