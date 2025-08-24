#!/usr/bin/env bash
# Run backend and frontend npm ci in parallel, wait for both, and exit non-zero if any fails.
set -euo pipefail

pids=()

# Start backend install
(cd backend && npm ci) &
pids+=("$!")

# Start frontend install
(cd frontend && npm ci) &
pids+=("$!")

rc=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    rc=$?
  fi
done

exit $rc
