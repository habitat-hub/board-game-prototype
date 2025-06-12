# パフォーマンス測定機能ドキュメント

このドキュメントでは、ボードゲームプロトタイプアプリケーションに実装されたパフォーマンス測定機能について説明します。

## 概要

パフォーマンス測定機能は以下の4つの主要コンポーネントで構成されています：

1. **PerformanceTracker** - 操作の実行時間を測定・記録
2. **RenderPerformance** - FPSとフレーム時間を監視
3. **MemoryUsage** - メモリ使用量を追跡
4. **DebugInfo** - 全ての測定結果を表示

## 機能詳細

### 1. PerformanceTracker (`utils/performanceTracker.ts`)

操作の実行時間を測定し、統計情報を保持します。

#### 機能:
- 同期・非同期操作の測定
- 最小・最大・平均実行時間の計算
- 実行回数のカウント
- リアルタイム統計更新

#### 使用方法:
```typescript
import { performanceTracker } from '@/features/prototype/performance';

// 同期操作の測定
const result = performanceTracker.measure('操作名', () => {
  // 測定したい処理
  return someOperation();
});

// 非同期操作の測定
const result = await performanceTracker.measureAsync('非同期操作名', async () => {
  // 測定したい非同期処理
  return await someAsyncOperation();
});
```

### 2. RenderPerformance (`hooks/useRenderPerformance.ts`)

アプリケーションのレンダリングパフォーマンスを監視します。

#### 測定項目:
- **FPS**: 1秒間のフレーム数
- **Frame Time**: 最新フレームの実行時間
- **Average Frame Time**: 直近100フレームの平均時間
- **Worst Frame Time**: 最も時間がかかったフレーム

#### 使用方法:
```typescript
import { useRenderPerformance } from '@/features/prototype/performance';

const MyComponent = () => {
  const { fps, renderTime, avgFrameTime, worstFrameTime } = useRenderPerformance();
  
  return (
    <div>
      <p>FPS: {fps}</p>
      <p>Frame Time: {renderTime.toFixed(2)} ms</p>
    </div>
  );
};
```

### 3. MemoryUsage (`hooks/useMemoryUsage.ts`)

JavaScript ヒープメモリの使用状況を監視します。

#### 測定項目:
- **Used Memory**: 現在使用中のメモリ
- **Total Memory**: 割り当て済みの総メモリ
- **Memory Limit**: 使用可能な最大メモリ
- **Usage Percentage**: 使用率（パーセンテージ）
- **Device Memory**: デバイスの総メモリ（対応ブラウザのみ）

#### 使用方法:
```typescript
import { useMemoryUsage } from '@/features/prototype/performance';

const MyComponent = () => {
  const { memoryInfo, formatMemory } = useMemoryUsage();
  
  return (
    <div>
      <p>Used: {formatMemory(memoryInfo.usedJSHeapSize)}</p>
      <p>Usage: {memoryInfo.usedPercentage?.toFixed(1)}%</p>
    </div>
  );
};
```

### 4. PerformanceTracker Hook (`hooks/usePerformanceTracker.ts`)

React コンポーネント内でパフォーマンス測定を簡単に使用できます。

#### 機能:
- 測定結果のリアルタイム取得
- 統計のリセット機能
- コンポーネント内での測定実行

#### 使用方法:
```typescript
import { usePerformanceTracker } from '@/features/prototype/performance';

const MyComponent = () => {
  const { metrics, resetMetrics, measureOperation } = usePerformanceTracker();
  
  const handleClick = () => {
    measureOperation('Button Click', () => {
      // クリック処理
    });
  };
  
  return (
    <div>
      <button onClick={handleClick}>測定付きボタン</button>
      <button onClick={resetMetrics}>統計リセット</button>
    </div>
  );
};
```

## DebugInfo での表示

全ての測定結果は `DebugInfo` コンポーネントで確認できます。

### 表示内容:
1. **Performance セクション**
   - FPS（色分け表示：30未満=赤、50未満=黄、50以上=緑）
   - フレーム時間統計
   - メモリ使用量（使用率に応じた色分け）
   - 操作別実行時間統計

2. **操作時間詳細**
   - 各操作の最新・平均・最小/最大実行時間
   - 実行回数
   - 統計リセットボタン

### 表示切り替え:
- **Mac**: `Cmd + i`
- **Windows**: `Ctrl + i`

## 推奨される使用パターン

### 1. 重要な操作の測定
```typescript
// 部品移動
const movePart = (partId: number, x: number, y: number) => {
  return performanceTracker.measure('Part Move', () => {
    updatePartPosition(partId, x, y);
  });
};

// 部品選択
const selectParts = (partIds: number[]) => {
  return performanceTracker.measure('Part Selection', () => {
    setSelectedParts(partIds);
  });
};
```

### 2. レンダリング処理の測定
```typescript
const renderCanvas = (parts: Part[], camera: Camera) => {
  return performanceTracker.measure('Canvas Render', () => {
    drawParts(parts, camera);
  });
};
```

### 3. データ操作の測定
```typescript
const loadPrototype = async (id: string) => {
  return await performanceTracker.measureAsync('Prototype Load', async () => {
    return await fetchPrototype(id);
  });
};
```

## パフォーマンス最適化のヒント

### 1. FPS が低い場合 (< 30)
- レンダリング処理の最適化
- 不要な再レンダリングの削減
- 重い計算の最適化

### 2. メモリ使用量が高い場合 (> 80%)
- メモリリークの確認
- 不要なオブジェクトの削除
- キャッシュサイズの調整

### 3. 操作時間が長い場合
- アルゴリズムの最適化
- 非同期処理への変更
- バッチ処理の導入

## 注意事項

1. **本番環境での使用**
   - パフォーマンス測定はデバッグモード時のみ有効
   - 本番環境では測定オーバーヘッドを避ける

2. **メモリ測定の制限**
   - Chrome系ブラウザでのみ利用可能
   - 他のブラウザでは "N/A" と表示

3. **測定精度**
   - ブラウザや環境により測定精度が異なる
   - 相対的な比較に重点を置く

## トラブルシューティング

### Q: パフォーマンス情報が表示されない
A: デバッグモードが有効になっているか確認してください（Cmd+i / Ctrl+i）

### Q: メモリ情報が "N/A" と表示される
A: Chrome系ブラウザを使用しているか確認してください

### Q: FPS が 0 と表示される
A: ブラウザがバックグラウンドにないか、アニメーションが動作しているか確認してください
