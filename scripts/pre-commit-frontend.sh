#!/usr/bin/env bash
# Run frontend-specific pre-commit tasks
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

printf '\n🔧 Running lint:fix and format in frontend\n'
(cd frontend && npm run lint:fix && npm run format)

git add frontend
