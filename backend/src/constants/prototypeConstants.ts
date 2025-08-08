// プロトタイプ内のパーツの最大order値（排他的境界）
export const ORDER_MAX_EXCLUSIVE = 1;

// プロトタイプ内のパーツの最小order値（排他的境界）
export const ORDER_MIN_EXCLUSIVE = 0;

/**
 * パーツ順序のリバランスが必要かどうかを判定する最小間隔
 *
 * 隣接するパーツのorder値の差がこの値を下回った場合にリバランス処理を実行する。
 *
 * 値の根拠：
 * - JavaScript: IEEE 754倍精度（64bit）で約15-17桁の有効数字を安全に扱える
 * - PostgreSQL FLOAT: 倍精度（64bit）で同等の精度を保持可能
 * - リバランス頻度を最小限に抑えることでパフォーマンスを向上させる
 */
export const MIN_ORDER_GAP = 1e-10;
