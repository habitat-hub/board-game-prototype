#!/usr/bin/env ts-node

/**
 * データベースシードスクリプト
 *
 * 使用方法:
 * npm run seed          - 開発環境でシードを実行
 * npm run seed:force    - 強制的にテーブルを再作成してシード
 */

import dotenv from 'dotenv';
import { runSeeders } from './seeders/index';

// 環境変数を読み込み
dotenv.config();

async function main() {
  const force = process.argv.includes('--force');

  try {
    console.log('🌱 Starting database seeding process...');
    console.log(`Force mode: ${force ? 'ON' : 'OFF'}`);

    if (force) {
      console.log('⚠️  WARNING: Force mode will drop and recreate all tables!');
      console.log('This will delete all existing data.');

      // 5秒待機して確認
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await runSeeders(force);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// シードスクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main();
}
