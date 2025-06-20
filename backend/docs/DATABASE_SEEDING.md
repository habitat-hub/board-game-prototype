# Database Seeding

このプロジェクトでは、初期データの投入にシードシステムを使用しています。

## 使用方法

### 開発環境でのシード実行
```bash
npm run seed
```

### 強制的にテーブルを再作成してシード（⚠️ 全データ削除）
```bash
npm run seed:force
```

## シードデータの内容

### ロール（Roles）
- `admin` - システム管理者（全権限）
- `editor` - 編集者（読み書き権限）
- `player` - プレイヤー（読み取り・プレイ権限）
- `viewer` - 閲覧者（読み取り権限のみ）

### 権限（Permissions）
- プロトタイプグループ関連
  - `read_prototype_group` - プロトタイプグループの閲覧
  - `write_prototype_group` - プロトタイプグループの編集
  - `delete_prototype_group` - プロトタイプグループの削除
  - `manage_prototype_group` - プロトタイプグループの管理

- プロトタイプ関連
  - `read_prototype` - プロトタイプの閲覧
  - `write_prototype` - プロトタイプの編集
  - `delete_prototype` - プロトタイプの削除
  - `play_prototype` - プロトタイプでのゲームプレイ

- ユーザー管理関連
  - `read_user` - ユーザー情報の閲覧
  - `manage_user` - ユーザー管理

## 新しいシードファイルの追加

新しいシードファイルを追加する場合：

1. `src/database/seeders/` に `002-example.ts` のような番号付きファイルを作成
2. `src/database/seeders/index.ts` でシードを呼び出し
3. シードファイルは冪等性（何度実行しても同じ結果）を保つこと

## 注意事項

- 本番環境では自動的にシードは実行されません
- 開発環境ではサーバー起動時に自動的にシードが実行されます
- `seed:force` は**全データを削除**するため、本番環境では絶対に使用しないでください
