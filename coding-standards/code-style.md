# コードスタイル

## TypeScript

### 型定義

- 型定義を明示的に行う
- `any`型の使用を避ける
- インターフェースは`I`プレフィックスを付けない
- 型エクスポートは`export type`を使用

```typescript
// 良い例
export interface GameBoardProps {
  width: number;
  height: number;
}

export type GameMode = "edit" | "play";

// 悪い例
export interface IGameBoardProps {
  width: any;
  height: any;
}
```

### 型推論

- 可能な限り型推論を活用
- 明示的な型注釈が必要な場合のみ使用

```typescript
// 良い例
const gameBoard = { width: 800, height: 600 };
const gameMode: GameMode = "edit";

// 悪い例
const gameBoard: { width: number; height: number } = {
  width: 800,
  height: 600,
};
```

## React コンポーネント

### 基本原則

- 関数コンポーネントを使用
- Props 型を明示的に定義
- デフォルトエクスポートを使用
- コンポーネント名はファイル名と一致させる

```typescript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  onClick,
  variant = "primary",
}: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### コンポーネント構造

- 一つのファイルには一つのコンポーネントのみを定義
- 関連するコンポーネントは同じフォルダに配置

### Props の設計

- 必須プロパティとオプショナルプロパティを明確に分ける
- デフォルト値を適切に設定
- 型安全性を保つ

```typescript
interface UserCardProps {
  user: User; // 必須
  showEmail?: boolean; // オプショナル
  onEdit?: (user: User) => void; // オプショナル
}
```

## CSS / Tailwind

### Tailwind CSS の使用

- Tailwind CSS クラスを優先使用
- カスタム CSS は最小限に
- レスポンシブデザインを考慮
- ダークモード対応を考慮

```tsx
// 良い例
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Title</h1>
</div>
```

### カスタム CSS

- コンポーネント固有のスタイルのみカスタム CSS を使用
- CSS Modules または styled-components を検討
- グローバルスタイルは最小限に

```css
/* コンポーネント固有のスタイル */
.game-board {
  @apply relative w-full h-full bg-gray-100;
}

.game-piece {
  @apply absolute cursor-pointer transition-transform hover:scale-105;
}
```

## 状態管理

### Context API

- グローバル状態には Context API を使用
- Provider は適切なスコープで提供
- パフォーマンスを考慮して Context を分割

```typescript
// contexts/UserContext.tsx
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

### カスタムフック

- ロジックの再利用にはカスタムフックを使用
- フック名は`use`で始める
- 依存関係を最小限に保つ

```typescript
// hooks/useGameState.ts
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>("waiting");

  const startGame = useCallback(() => {
    setGameState("playing");
  }, []);

  const endGame = useCallback(() => {
    setGameState("finished");
  }, []);

  return { gameState, startGame, endGame };
}
```

## エラーハンドリング

### フロントエンド

- try-catch 文でエラーをキャッチ
- ユーザーフレンドリーなエラーメッセージを表示
- エラー境界（Error Boundary）を使用

```typescript
// エラーハンドリングの例
try {
  const result = await apiCall();
  setData(result);
} catch (error) {
  console.error("API call failed:", error);
  setError("データの取得に失敗しました");
}
```

## コメント・ドキュメント

### JSDoc

- 複雑な関数には JSDoc 形式でコメントを追加
- 型情報を含める

```typescript
/**
 * ゲームボードの初期化を行う
 * @param width - ボードの幅
 * @param height - ボードの高さ
 * @returns 初期化されたゲームボード
 */
function initializeGameBoard(width: number, height: number): GameBoard {
  // 実装
}
```

### TODO コメント

- 今後の改善点を明記
- 期限や優先度を含める

```typescript
// TODO: パフォーマンス最適化が必要（2024年3月まで）
// FIXME: この部分は後で修正する
```

## 関連ドキュメント

- [ファイル・フォルダ命名規則](./02-naming-conventions.md)
- [アーキテクチャ設計](./04-architecture.md)
- [パフォーマンス](./06-performance.md)
