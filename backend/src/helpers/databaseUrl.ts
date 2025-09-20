type NodeEnv = 'development' | 'test' | 'production';

export function withNeonTransactionPooler(
  databaseUrl: string,
  nodeEnv: NodeEnv
): string {
  if (nodeEnv !== 'production') {
    return databaseUrl;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (!hostname.endsWith('neon.tech')) {
      return databaseUrl;
    }

    const currentPoolerMode = parsedUrl.searchParams.get('poolerMode');

    if (currentPoolerMode?.toLowerCase() === 'transaction') {
      return parsedUrl.toString();
    }

    parsedUrl.searchParams.set('poolerMode', 'transaction');

    return parsedUrl.toString();
  } catch {
    return databaseUrl;
  }
}
