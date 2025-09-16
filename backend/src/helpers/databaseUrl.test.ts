import { describe, expect, it } from 'vitest';
import { withNeonTransactionPooler } from './databaseUrl';

const neonHostUrl =
  'postgres://user:pass@ep-sample-123.ap-northeast-1.aws.neon.tech/neondb';

describe('withNeonTransactionPooler', () => {
  it('adds poolerMode in production for Neon connections without existing params', () => {
    const result = withNeonTransactionPooler(neonHostUrl, 'production');

    expect(result).toBe(`${neonHostUrl}?poolerMode=transaction`);
  });

  it('appends poolerMode when other parameters are present', () => {
    const url = `${neonHostUrl}?sslmode=require`;
    const result = withNeonTransactionPooler(url, 'production');

    expect(result).toBe(
      `${neonHostUrl}?sslmode=require&poolerMode=transaction`
    );
  });

  it('overwrites an existing poolerMode parameter', () => {
    const url = `${neonHostUrl}?poolerMode=session&sslmode=require`;
    const result = withNeonTransactionPooler(url, 'production');

    expect(result).toBe(
      `${neonHostUrl}?poolerMode=transaction&sslmode=require`
    );
  });

  it('does not modify URLs in non-production environments', () => {
    const result = withNeonTransactionPooler(neonHostUrl, 'development');

    expect(result).toBe(neonHostUrl);
  });

  it('does not modify non-Neon hosts', () => {
    const url = 'postgres://user:pass@localhost:5432/dbname';
    const result = withNeonTransactionPooler(url, 'production');

    expect(result).toBe(url);
  });

  it('returns the original string when the URL cannot be parsed', () => {
    const url = 'not-a-valid-url';
    const result = withNeonTransactionPooler(url, 'production');

    expect(result).toBe(url);
  });
});
