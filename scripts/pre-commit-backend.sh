#!/usr/bin/env bash
# Run backend-specific pre-commit tasks
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

printf '\n🔧 Running lint-staged in backend (staged files only)\n'
(cd backend && npx --no-install lint-staged)

printf '\n🔧 Running docs and types generation in backend\n'
(cd backend && npm run generate-erd && npm run redoc && npm run generate-api-types)

if [ -f docs/index.html ]; then
  git add docs/index.html
  echo "✨ Added docs/index.html to staging"
fi

if [ -f backend/.erd-metadata.json ]; then
  git add backend/.erd-metadata.json
  echo "✨ Added backend/.erd-metadata.json to staging"
fi

if [ -f backend/.api-types-metadata.json ]; then
  git add backend/.api-types-metadata.json
  echo "✨ Added backend/.api-types-metadata.json to staging"
fi

for file in frontend/src/api/types/*; do
  if [ -f "$file" ]; then
    git add "$file"
    echo "✨ Added $file to staging"
  fi
done
