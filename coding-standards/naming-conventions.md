# ファイル・フォルダ命名規則

## ディレクトリ構造

### フロントエンド（Next.js）

```
src/
├── components/          # コンポーネント（Atomic Design）
│   ├── atoms/          # 最小単位のコンポーネント
│   ├── molecules/      # atomsを組み合わせたコンポーネント
│   ├── organisms/      # moleculesを組み合わせたコンポーネント
│   └── templates/      # ページレイアウト
├── features/           # 機能別モジュール
├── hooks/              # カスタムフック
├── contexts/           # React Context
├── utils/              # ユーティリティ関数
└── types/              # TypeScript型定義
```

### バックエンド（Express.js）

```
src/
├── routes/             # API ルート
├── models/             # データベースモデル
├── services/           # ビジネスロジック
├── middlewares/        # ミドルウェア
├── utils/              # ユーティリティ関数
├── types/              # TypeScript型定義
└── config/             # 設定ファイル
```

## ファイル命名規則

### コンポーネント

- **命名**: PascalCase
- **例**: `GameBoard.tsx`, `UserProfile.tsx`, `LoginForm.tsx`

### フック

- **命名**: camelCase + `use`プレフィックス
- **例**: `useSocket.ts`, `useAuth.ts`, `useGameState.ts`

### ユーティリティ

- **命名**: camelCase
- **例**: `dateFormat.ts`, `apiClient.ts`, `validation.ts`

### 型定義

- **命名**: PascalCase
- **例**: `Api.ts`, `User.ts`, `GameBoard.ts`

### 定数

- **命名**: UPPER_SNAKE_CASE
- **例**: `GAME_BOARD_CONSTANTS.ts`, `API_ENDPOINTS.ts`

### テストファイル

- **命名**: `*.test.ts` または `*.spec.ts`
- **例**: `GameBoard.test.tsx`, `useAuth.spec.ts`

## フォルダ命名規則

### 機能別フォルダ

- **命名**: kebab-case
- **例**: `game-board/`, `user-profile/`, `auth/`

### コンポーネントカテゴリ

- **命名**: 複数形の camelCase
- **例**: `atoms/`, `molecules/`, `organisms/`

## インデックスファイル

- 型定義、定数定義フォルダに `index.ts` を作成
- エクスポートを一元管理

```typescript
// components/types/index.ts
export * from "./Api";
export * from "./Auth";
```

## 命名のベストプラクティス

### 良い例

- `GameBoard.tsx` - 明確で具体的
- `useGameState.ts` - 機能を表す名前
- `apiClient.ts` - 用途が分かりやすい
- `GAME_CONSTANTS.ts` - 定数であることが明確

### 悪い例

- `Component.tsx` - 汎用的すぎる
- `hook.ts` - 機能が不明確
- `util.ts` - 用途が不明
- `data.ts` - 内容が不明確

## 関連ドキュメント

- [コードスタイル](./03-code-style.md)
- [アーキテクチャ設計](./04-architecture.md)
