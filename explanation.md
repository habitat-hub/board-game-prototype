# Unstaged Changes Deep Dive (2025-09-21)

## Backend
- `backend/src/routes/user.ts`: The Swagger annotation for `PUT /api/users/{userId}/need-tutorial` now documents `needTutorial` as a required boolean and adds a Japanese description so the contract is explicit for client generators.
- `backend/__generated__/swagger-output.json` & `backend/__generated__/index.html`: Regenerated Redoc/Swagger assets pick up the new `needTutorial` requirement, inject the description text, and reformat `enum`/`required` arrays (the generator now emits multi-line arrays).
- `backend/src/scripts/generateApiTypes.ts`: Drops the `--modular` flag, adds `--clean-output`, and now writes to `frontend/src/__generated__/api/client` with the bundle name `index.ts`, consolidating the generated SDK in a dedicated `client` folder.
- `backend/src/scripts/__generated__/api-types-metadata.json`: Mirrors the generator change by listing only `frontend/src/__generated__/api/client/index.ts` as an output, so the script watcher stops expecting the removed modular files.

## Frontend
- `frontend/src/__generated__/api/client/index.ts`: Regenerated with the non-modular preset; this single entrypoint now contains the HTTP client, data contracts, and helper types that previously lived in separate modules. The `UsersNeedTutorialListData` interface now ships with the `needTutorial` description and implicitly becomes required.
- Removed generated modules (`Auth.ts`, `User.ts`, `data-contracts.ts`, `http-client.ts`, `index.ts` under the old `frontend/src/__generated__/api/types/` folder): They vanished because `--modular` was disabled and `--clean-output` purged the legacy layout.
- Wrapper exports (`frontend/src/api/types/*.ts`): Each file now simply re-exports from the consolidated `@/__generated__/api/client`, and `frontend/src/api/types/index.ts` re-exports those wrappers so existing `@/api/types` imports remain valid.

## Documentation & Notes
- `AGENTS.md` / `README.md`: Both docs now warn only `frontend/src/__generated__/api/client/index.ts` is generated, matching the new single-file output.
- `explanation-of-generated-files.txt`: Added as an auxiliary note describing why the wrapper directory remains even though the generator output shrank to one file.

## Impact
- Type-safe clients stay in sync with the backend contract while keeping application imports unchanged.
- Future regenerations will no longer leave obsolete files behind, reducing review noise.
- The API spec now guarantees that `needTutorial` is always present in responses, which should prevent undefined checks on the frontend.
