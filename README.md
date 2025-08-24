# KIBAKO

## 概要

ボードゲームのプロトタイプを作成するためのアプリケーション

## ドキュメント

- [API 仕様書](https://habitat-hub.github.io/board-game-prototype/)
- [開発ガイド](https://github.com/habitat-hub/board-game-prototype/wiki)

## ディレクトリ構成

- `frontend/`: フロントエンドのソースコード
- `backend/`: バックエンドのソースコード

## セットアップ

### 前提条件

- Node.js
- npm または yarn
- Docker, Docker Compose
- その他必要なツールやライブラリ

### インストール

リポジトリをクローン

```zsh
git clone https://github.com/habitat-hub/board-game-prototype.git
cd board-game-prototype
```

### フロントエンド、バックエンドのパッケージインストール

```zsh
make ci
```

### フロントエンドのセットアップ

#### 環境設定

```zsh
cp .env_example .env.local
```

#### パッケージのインストール

```zsh
cd frontend
npm ci
```

### バックエンドのセットアップ

#### 環境設定

```zsh
cp .env_example .env
```

- Google Cloud の API キーを取得して、`.env`ファイルに設定する
- postgres の接続情報が異なる場合は、`.env`ファイルの DATABASE_URL を変更する

#### パッケージのインストール

```zsh
cd ../backend
npm ci
```

## 開発サーバー起動方法

### 一括で起動する場合

```zsh
make dev
```

### その他のコマンドを確認するには...

```zsh
make help
```

詳しくは [Makefile](https://github.com/habitat-hub/board-game-prototype/blob/develop/Makefile) を参照してください。

## API タイプ生成

このプロジェクトでは、バックエンドのSwagger仕様書から自動的にTypeScriptの型定義を生成しています。

### 自動生成ファイル

以下のファイルは自動生成されるため、直接編集しないでください：

- `frontend/src/api/types/Api.ts`
- `frontend/src/api/types/Auth.ts`
- `frontend/src/api/types/data-contracts.ts`
- `frontend/src/api/types/http-client.ts`

### 型定義の更新方法

1. バックエンドでSwagger定義を更新
2. バックエンドディレクトリで以下のコマンドを実行：

```zsh
cd backend
npm run generate-swagger
npm run generate-api-types
```

**注意**: これらのファイルは`.eslintignore`で除外されており、lintチェックの対象外です。

## ER 図

![ER図](backend/erd.svg)
