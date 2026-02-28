#!/bin/bash
# PreToolUse フック: ソースコード変更前にドキュメント更新を強制する
#
# src/ または test/ のファイルを Edit/Write する前に、
# docs/ または steering/ に未コミットの変更があるかチェックする。
# 変更がなければブロック（exit 2）する。

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then exit 0; fi

# ソースコード（src/ または test/）以外は対象外
if [[ ! "$FILE_PATH" =~ /(src|test)/ ]]; then exit 0; fi

# docs/ または steering/ に未コミットの変更（unstaged + staged + untracked）があれば OK
cd "$CLAUDE_PROJECT_DIR" || exit 0
CHANGES=$(git status --porcelain docs/ steering/ 2>/dev/null)

if [ -n "$CHANGES" ]; then
  exit 0
fi

echo "ソースコードを変更する前に docs/todo/todo.md と steering/ を更新してください。" >&2
exit 2
