FROM node:22-slim

# Claude Code CLI をインストール
RUN npm install -g @anthropic-ai/claude-code

# git をインストール（worktree操作に必要）
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存パッケージをインストール
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# TypeScriptをビルド
COPY package.json package-lock.json tsconfig.json ./
COPY src/ src/
RUN npm ci && npm run build && npm prune --omit=dev

# 実行ユーザーを設定
RUN chown -R node:node /app
USER node

# git の安全ディレクトリ設定
RUN git config --global --add safe.directory /app

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
