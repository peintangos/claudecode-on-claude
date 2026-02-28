# TODO

## 自律開発オーケストレータの構築

- [x] Step 1: TypeScript基盤のセットアップ（package.json, tsconfig.json, index.js削除）
- [x] Step 2: 基盤モジュール作成（config.ts, logger.ts, types.ts, .env.example）
- [x] Step 3: GitHub APIクライアント（github.ts）
- [x] Step 4: Claude Code CLI実行ラッパー（claude.ts）
- [x] Step 5: Issue実装ハンドラー（task-handler.ts）
- [x] Step 6: ポーリング・ワーカープール・エントリポイント（worker-pool.ts, poller.ts, index.ts）
- [x] Step 7: PRレビュー対応ハンドラー（review-handler.ts）
- [x] Step 8: CLAUDE.md + デプロイ設定（Dockerfile, docker-compose.yml）

## バグ修正

- [ ] dotenv を追加して .env ファイルを読み込むようにする
