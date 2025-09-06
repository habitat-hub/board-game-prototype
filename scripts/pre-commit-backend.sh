#!/usr/bin/env bash
# Run backend-specific pre-commit tasks
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

printf '\n🔧 Running lint:fix, format, and docs generation in backend\n'
(cd backend && npm run lint:fix && npm run format && npm run generate-erd && npm run redoc && npm run generate-api-types)

git add backend

if [ -f docs/index.html ]; then
  git add docs/index.html
  echo "✨ Added docs/index.html to staging"
fi

for file in frontend/src/api/types/*; do
  if [ -f "$file" ]; then
    git add "$file"
    echo "✨ Added $file to staging"
  fi
done
