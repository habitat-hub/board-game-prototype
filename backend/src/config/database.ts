import sequelize from '../models';
import { setupAssociations } from '../database/associations';

/**
 * データベース接続と初期化を行う
 */
export async function connectDatabase(): Promise<void> {
  try {
    setupAssociations();
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected successfully');

    const { initializeDatabaseIfNeeded } = await import(
      '../database/initializer'
    );
    await initializeDatabaseIfNeeded();
    console.log('🚀 Server is ready to accept connections');
  } catch (error) {
    console.error('❌ データベース初期化処理でエラーが発生しました:', error);
    throw error;
  }
}
