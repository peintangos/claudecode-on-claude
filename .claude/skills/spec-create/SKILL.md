---
name: spec-create
description: 新しい機能仕様書（specification）を作成し、progress.mdとroadmap.mdを更新する
user-invocable: true
---

# 機能仕様書（Specification）作成

引数として機能名を受け取る: `$ARGUMENTS`

## 手順

1. **PRD要件の確認**: `docs/prd.md` または該当する `docs/prd-enhance-*.md` を読み、この機能がどのPRD要件に対応するか特定する
2. **既存specificationの確認**: `docs/specifications/` を確認し、重複がないか確認する
3. **specification作成**: 以下のテンプレートに従って `docs/specifications/YYYY-MM-DD-<slug>.md` を作成する
4. **progress.md更新**: `docs/progress.md` に新specificationを追加（状態: 📋 計画中）
5. **roadmap.md確認**: 必要に応じて `docs/roadmap.md` に反映

## Specification テンプレート（Gherkin フォーマット）

~~~markdown
# [機能名]

## 概要

- 対応PRD要件: [PRDのどの要件を満たすか]
- 作成日: YYYY-MM-DD
- 状態: 計画中 / 開発中 / 完了

## 背景・目的

[この機能が必要な理由]

## 機能仕様

### Feature: [機能名]

```
  背景:
    [この機能の背景説明]

  Scenario: [シナリオ名1]
    Given [前提条件]
    When [操作・イベント]
    Then [期待結果]

  Scenario: [シナリオ名2]
    Given [前提条件]
    When [操作・イベント]
    Then [期待結果]
```

## 画面・UI仕様

[UIに関する要件。モックアップやワイヤーフレームの説明]

## 技術的考慮事項

[実装に関する技術的な注意点]

## 受入条件

- [ ] [条件1]
- [ ] [条件2]

## 実装ステップ

1. [ ] [ステップ1]
2. [ ] [ステップ2]
3. [ ] [ステップ3]
4. [ ] レビュー（ビルド確認 + Lint + `/code-review`）
~~~

### 6. todo 更新

- `docs/todo/todo.md` に specification の実装ステップをタスクとして追加する
- ステップが多い場合や背景説明が必要な場合は詳細ページ（`docs/todo/<slug>.md`）を作成してリンクする

## 注意事項

- ファイル名は `YYYY-MM-DD-<slug>.md` 形式（例: `2026-02-22-seo-ogp.md`）
- 日本語で記述する
- Gherkin の Given/When/Then は日本語でも英語でも可
- 実装ステップの末尾には必ずレビューステップ（ビルド確認 + Lint + `/code-review`）を含めること
- このスキルではソースコードの実装・変更は行わない。ドキュメントの更新のみに留める
