#!/usr/bin/env bash
# Run frontend-specific pre-commit tasks
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

printf '\n🔧 Running lint-staged in frontend (staged files only)\n'
(cd frontend && npx --no-install lint-staged)
