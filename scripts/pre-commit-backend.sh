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

add_if_changed docs/index.html docs/index.html

add_if_changed backend/src/scripts/metadata/redoc.json backend/src/scripts/metadata/redoc.json

add_if_changed backend/src/scripts/metadata/swagger-schemas.json backend/src/scripts/metadata/swagger-schemas.json

add_if_changed backend/src/scripts/metadata/swagger-output.json backend/src/scripts/metadata/swagger-output.json

add_if_changed backend/src/scripts/metadata/erd.json backend/src/scripts/metadata/erd.json

add_if_changed backend/src/scripts/metadata/api-types.json backend/src/scripts/metadata/api-types.json

add_if_changed backend/erd.svg backend/erd.svg

add_if_changed backend/src/swagger-schemas.ts backend/src/swagger-schemas.ts

add_if_changed backend/swagger-output.json backend/swagger-output.json

TYPES_DIFF=$(git status --porcelain=1 frontend/src/api/types 2>/dev/null)
if [ -n "$TYPES_DIFF" ]; then
  for file in frontend/src/api/types/*; do
    if [ -f "$file" ]; then
      git add "$file"
      echo "✨ Added $file to staging"
    fi
  done
else
  echo "✅ No API type changes detected"
fi
