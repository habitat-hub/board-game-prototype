// 環境名を表す型（NODE_ENVの候補値）
type NodeEnv = 'development' | 'test' | 'production';

/**
 * Neonの本番接続URLに poolerMode=transaction を付加するユーティリティ
 * @param databaseUrl Neon/PostgreSQLの接続URL
 * @param nodeEnv 現在のNODE_ENV
 * @returns poolerModeを必要に応じて付与したURL
 */
export function withNeonTransactionPooler(
  databaseUrl: string,
  nodeEnv: NodeEnv
): string {
  // 本番環境以外の場合
  if (nodeEnv !== 'production') {
    return databaseUrl;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    const neonDomain = 'neon.tech';

    const isNeonHost =
      hostname === neonDomain || hostname.endsWith(`.${neonDomain}`);

    // Neonホストでない場合
    if (!isNeonHost) {
      return databaseUrl;
    }

    const currentPoolerMode = parsedUrl.searchParams.get('poolerMode');

    // 既にtransaction指定がある場合
    if (currentPoolerMode?.toLowerCase() === 'transaction') {
      return parsedUrl.toString();
    }

    parsedUrl.searchParams.set('poolerMode', 'transaction');

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}
