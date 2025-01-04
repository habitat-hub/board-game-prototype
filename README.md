# BoardCraft

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
- その他必要なツールやライブラリ

### インストール

リポジトリをクローン

```bash
git clone https://github.com/habitat-hub/board-game-prototype.git
cd board-game-prototype
```

### フロントエンドのセットアップ

#### パッケージのインストール

```bash
cd frontend
npm ci
```

#### 環境設定

```bash
cp .env_example .env.local
```

### バックエンドのセットアップ

#### パッケージのインストール

```bash
cd ../backend
npm ci
```

#### データベースのセットアップ

postgres のデータベースを作成する

#### 環境設定

```bash
cp .env_example .env
```

Google Cloud の API キーを取得して、`.env`ファイルに設定する

postgres の接続情報が異なる場合は、`.env`ファイルの DATABASE_URL を変更する

## 実行方法

### フロントエンド

```bash
cd frontend
npm run dev
```

### バックエンド

```bash
cd backend
npm run dev
```

## ER 図

![ER図](backend/erd.svg)
