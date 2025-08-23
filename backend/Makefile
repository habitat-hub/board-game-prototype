# 説明:
# docker compose（ハイフンなし）が利用できない場合は、まず Docker を最新版にアップデートしてください。
# 古い Docker では 'docker compose' サブコマンドが存在しないことがあります。
# 一時的な回避策として、直ちに対応できない場合は up2 を利用してください。
# 注意:
# - 恒久的な解決は Docker の更新が推奨されます。
# - up2 は一時的な手段のため、挙動や利用可能なオプションが異なる場合があります。必要に応じて動作確認を行ってください。

# To start postgresql server for development, run `make up`
up:
	docker compose up -d

up2:
	docker-compose up -d

# To stop postgresql server for development, run `make down`
down:
	docker compose down

down2:
	docker-compose down

# To delete all data in the database, run `make destroy`
destroy:
	docker compose down -v

destroy2:
	docker-compose down -v