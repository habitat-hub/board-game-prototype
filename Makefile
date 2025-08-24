# 使用するシェルを明示（zsh があればそれを使い、なければ bash、それも無ければ /bin/sh を使う）
# CI や他環境でデフォルトが異なると Make の挙動が変わるため明示的に設定するが
# /bin/zsh をハードコードせず、存在するシェルを検出して設定する。
# `command -v` を使って zsh -> bash の順で検出し、両方見つからない場合は /bin/sh を使う。
SHELL := $(or $(shell command -v zsh 2>/dev/null), $(shell command -v bash 2>/dev/null), /bin/sh)

# .ONESHELL: 同一ターゲット内の複数行レシピを同じシェルで実行
# 行間で cd や環境変数を共有する場合に有効
# 問題なければ削除しても動作する
.ONESHELL:

# .PHONY: ターゲットをファイル名と区別して常に実行させる
# 同名のファイルがあると Make がターゲットをスキップするのを防ぐ
.PHONY: help dev db-up db-down db-status db-status_deprecated up up2 down down2 destroy destroy2 backend-dev frontend-dev install-backend install-frontend ci


help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@echo "  backend-ci     backendでnpm ciを実行します。"
	@echo "  frontend-ci    frontendでnpm ciを実行します。"
	@echo "  ci              backend, frontendそれぞれの依存関係を npm ci でインストールします。"
	@echo "  dev             DB を起動し、バックエンドとフロントエンドの開発サーバーをフォアグラウンドで起動します（Ctrl+C で停止）。"
	@echo "  db-up           DB コンテナのみを起動します（backend/docker-compose.yml を使用）。"
	@echo "  db-up-detached  DB コンテナをバックグラウンドで起動します。"
	@echo "  db-down         DB コンテナを停止します。"
	@echo "  db-destroy      DB を停止してボリュームを削除します（データを削除します）。"
	@echo "  db-status       DB コンテナの起動状況を表示します（backend/docker-compose.yml を使用）。"
	@echo ""
	@echo "Notes:"
	@echo "  - このリポジトリは 'docker compose' を想定しています。古い Docker 環境向けに 'docker-compose' を使う代替ターゲット（*_deprecated）も用意しています。"
	@echo "  - docker compose ファイル: backend/docker-compose.yml"
	@echo "  - dev タスクは npx concurrently を使って db, backend, frontend を同時に実行します。"

backend-ci:
	@echo "Running npm ci in backend"
	@cd backend && npm ci
frontend-ci:
	@echo "Running npm ci in frontend"
	@cd frontend && npm ci

ci:
	@echo "Installing backend and frontend in parallel"
	@(cd backend && npm ci) &
	@(cd frontend && npm ci) &
	wait

dev:
	@echo "Starting db, backend and frontend in foreground using 'concurrently' (Ctrl+C stops all)."
	@cd "$(CURDIR)" && npx -y concurrently --names "db,backend,frontend" -c "magenta,green,cyan" \
		"docker compose -f backend/docker-compose.yml up" \
		"cd backend && npm run dev" \
		"cd frontend && npm run dev"
dev_deprecated:
	@echo "Starting db, backend and frontend in foreground using 'concurrently' (Ctrl+C stops all)."
	@cd "$(CURDIR)" && npx -y concurrently --names "db,backend,frontend" -c "magenta,green,cyan" \
		"docker-compose -f backend/docker-compose.yml up" \
		"cd backend && npm run dev" \
		"cd frontend && npm run dev"

db-up:
	docker compose -f backend/docker-compose.yml up

db-up_deprecated:
	docker-compose -f backend/docker-compose.yml up

db-up-detached:
	docker compose -f backend/docker-compose.yml up -d

db-up-detached_deprecated:
	docker-compose -f backend/docker-compose.yml up -d

db-down:
	docker compose -f backend/docker-compose.yml down

db-down_deprecated:
	docker-compose -f backend/docker-compose.yml down

db-status:
	docker compose -f backend/docker-compose.yml ps

db-status_deprecated:
	docker-compose -f backend/docker-compose.yml ps

db-destroy:
	docker compose -f backend/docker-compose.yml down -v

db-destroy_deprecated:
	docker-compose -f backend/docker-compose.yml down -v
