# CLAUDE.md

## プロジェクト概要

各プロジェクトの `CLAUDE.md` を参照。

## ワークフロー

### ドキュメント管理

#### ドキュメント体系

`docs/` 配下のドキュメントは以下の四層構造で管理する。メインエージェントが記述し、情報収集には Explore サブエージェントを活用する。

**PRD（プロダクト要件定義書）** — プロダクト全体の要件を定義

- `prd.md` — 初期MVP。背景・ペルソナ・大マイルストン・MVP機能要件を定義
- `prd-enhance-[index].md` — MVP完了後の拡張PRD。対話で次スコープを議論し記載
- PRDの必須セクション: 概要, 背景, プロダクト・プリンシプル, スコープ, 対象ユーザー, ユースケース, 機能要求, UX要求, システム要求, マイルストーン
- PRDの任意セクション: 市場分析, 競合分析, セキュリティ要件, プライバシー要件, パフォーマンス要件, マーケティング計画
- 初回PRD作成は `/prd-create` スキル、拡張PRDは `/prd-enhance` スキルを使用

**Specifications（機能仕様書）** — PRDを構成する機能群。PRDの要件を個別に仕様化したもの

- `specifications/YYYY-MM-DD-slug.md` — PRDの要件を満たす個別機能の仕様
- Gherkin フォーマット（Given/When/Then）で記述する
- 各specificationは対応するPRDの要件を明示的に参照する
- specificationsの集合体がPRDを実現する
- 各specificationに「実装ステップ」セクションを含め、開発時のステップ分割と進捗を管理する
- 詳細なテンプレートは `/spec-create` スキルが保持

**Roadmap（構想・計画）** — これから何を作るか

- `roadmap.md` — MVPや今後のエンハンスについての構想、決まっていることを記載
- MVPスコープやエンハンスについてのディスカッションが行われた場合に更新する

**Progress（開発進捗）** — specificationの完了状況

- `progress.md` — MVP/エンハンス別にspecificationの完了状況を記載
- 各specificationの開発詳細（ステップ単位の進捗）は `steering/` で管理する

**TODO（作業キュー）** — 次にやるべきこと

- `todo/todo.md` — 優先度順のタスクリスト（一覧性を保つ簡潔な記述）
- `todo/<slug>.md` — タスクの詳細ページ（必要な場合のみ作成。todo.md からリンク）
- specification のステップに限らず、バグ修正・割り込み対応など自由な粒度で記述可能
- 完了した行は削除する。全行削除されたらディレクトリも削除する
- 計画フェーズ（スキル / planモード）の成果物として更新される
- セッション開始時の最初の参照先

**その他**

- `architecture/architecture.md` — アーキテクチャ
- `architecture/adrs/YYYY-MM-DD-slug.md` — アーキテクチャ決定記録。重要な意思決定を行った場合に作成する
- `development-guidelines.md` — 開発ガイドライン

#### ドキュメントライフサイクル

1. **プロジェクト開始時**: `/prd-create` でPRDを作成し、specificationsに分割
2. **MVP/エンハンス完了時**: `/prd-enhance` で次スコープを議論 → 拡張PRD → 新specifications → roadmap/progress更新

### 開発の進め方

#### 計画フェーズ（ドキュメント整備 + todo 更新）

以下のスキルやplanモードでドキュメントを整備する。このフェーズではソースコードの変更は行わない。

- `/prd-create` / `/prd-enhance` — PRD 作成・拡張
- `/spec-create` — 機能仕様書の作成
- `/roadmap-update` — ロードマップ・進捗の更新
- `/req-update` — 要件変更の影響分析
- `/docs-review` — ドキュメント整合性確認
- planモード — スキルを使わない計画・議論

**計画フェーズの成果物として、`docs/todo/todo.md` にタスクを追加する。**

#### planモード完了時の todo 更新

planモードで計画が承認された場合、承認直後に以下を行う:

1. `docs/todo/todo.md` に計画で決まったタスクを追加する（planの要約）
2. ユーザーに掲示したプランをそのまま `docs/todo/<slug>.md` に詳細ページを作成しリンクする
3. steering/ の plan.md にも計画内容を転記する（既存ルール通り）

#### 実装フェーズ（コード変更）

`/implement` を使って todo のタスクを1つずつ実装する。
実装にはテスト作成 → `/test` → `/build-check` → `/code-review` のサイクルを含む。
完了後は `/commit-push` でコミット。

#### 作業完了時

以下を実行する:

- `progress.md` のspecification完了状況を更新
- 変更に関連する `specifications/` の受入条件を更新
- 構造変更があれば `architecture/architecture.md` を更新
- 重要な意思決定があれば `architecture/adrs/` にADRを作成
- 構想・計画に影響があれば `roadmap.md` を更新
- `docs/todo/todo.md` に次のタスクを追加する（次の specification ステップなど）。追加すべきタスクがなければ todo ディレクトリを削除する

### `steering/` — 作業ログ

作業開始時に作業単位でディレクトリを作成し、作業ログを記録する。メインエージェントが直接記述する。

- ディレクトリ名: `YYYY-MM-DD-<slug>/`（例: `2026-02-21-add-link-card/`）
- 各ディレクトリに以下の4ファイルを配置:
  - `plan.md` — 目的・やること・影響範囲（作業前に記述）。以下を必ず含めること:
    - **対象 Specification**: どの `specifications/` のどの実装ステップに対応する作業か
    - **全体ロードマップにおける位置づけ**: `docs/roadmap.md` を参照し、プロジェクト全体の進捗と今回の作業の位置づけを明記
  - `tasklist.md` — タスク一覧と進捗
  - `blocker.md` — ブロッカー・課題
  - `knowledge.md` — 学び・気づき（作業後に追記）
