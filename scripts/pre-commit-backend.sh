#!/usr/bin/env bash
# Run backend-specific pre-commit tasks
set -euo pipefail

add_if_changed() {
  local target="$1"
  local label="$2"

  if [ -e "$target" ]; then
    local diff
    diff=$(git status --porcelain=1 "$target" 2>/dev/null)
    if [ -n "$diff" ]; then
      git add "$target"
      printf '✨ Added %s to staging\n' "$label"
    else
      printf '✅ %s already up to date\n' "$label"
    fi
  fi
}

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

printf '\n🔧 Running lint-staged in backend (staged files only)\n'
(cd backend && npx --no-install lint-staged)

printf '\n🔍 Checking backend artifacts freshness\n'
STATUS=$(cd backend && npm run --silent check-artifacts)
if [ "$STATUS" = "needs" ]; then
  printf '🔁 Regenerating backend artifacts\n'
  (cd backend && npm run --silent generate-artifacts)
else
  printf '✅ Backend artifacts already fresh\n'
fi

add_if_changed backend/__generated__/index.html backend/__generated__/index.html

add_if_changed backend/src/scripts/__generated__/redoc-metadata.json backend/src/scripts/__generated__/redoc-metadata.json

add_if_changed backend/src/scripts/__generated__/swagger-schemas-metadata.json backend/src/scripts/__generated__/swagger-schemas-metadata.json

add_if_changed backend/src/scripts/__generated__/swagger-output-metadata.json backend/src/scripts/__generated__/swagger-output-metadata.json

add_if_changed backend/src/scripts/__generated__/erd-metadata.json backend/src/scripts/__generated__/erd-metadata.json

add_if_changed backend/src/scripts/__generated__/api-types-metadata.json backend/src/scripts/__generated__/api-types-metadata.json

add_if_changed backend/__generated__/erd.svg backend/__generated__/erd.svg

add_if_changed backend/src/__generated__/swagger-schemas.ts backend/src/__generated__/swagger-schemas.ts

add_if_changed backend/__generated__/swagger-output.json backend/__generated__/swagger-output.json

TYPES_DIFF=$(git status --porcelain=1 frontend/src/__generated__/api/client 2>/dev/null)
if [ -n "$TYPES_DIFF" ]; then
  for file in frontend/src/__generated__/api/client/*; do
    if [ -f "$file" ]; then
      git add "$file"
      echo "✨ Added $file to staging"
    fi
  done
else
  echo "✅ No API type changes detected"
fi
