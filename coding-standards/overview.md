# プロジェクト概要

## 概要

このプロジェクトは、ボードゲームプロトタイプのフルスタックアプリケーションです。
フロントエンド（Next.js + TypeScript）とバックエンド（Node.js + Express + TypeScript）で構成されています。

## 技術スタック

### フロントエンド

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API
- **UI ライブラリ**: カスタムコンポーネント（Konva.js for Canvas）

### バックエンド

- **フレームワーク**: Express.js
- **言語**: TypeScript
- **データベース**: PostgreSQL + Sequelize ORM
- **認証**: JWT + Session
- **ファイルストレージ**: AWS S3
- **リアルタイム通信**: Socket.io

## プロジェクト構造

```
board-game-prototype/
├── frontend/           # Next.js アプリケーション
├── backend/            # Express.js サーバー
├── docs/              # ドキュメント
└── README.md          # プロジェクト概要
```

## 開発環境

- Node.js 18 以上
- npm または yarn
- Docker（バックエンド開発用）
- PostgreSQL
