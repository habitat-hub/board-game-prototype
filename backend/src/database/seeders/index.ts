import sequelize from '../../models/index';
import { setupAssociations } from '../associations';
import { seedRolesAndPermissions } from './001-roles-and-permissions';

/**
 * すべてのシーダーを実行
 */
export async function runSeeders(force = false) {
  try {
    console.log('Starting database seeding...');

    // アソシエーションを設定
    setupAssociations();

    // データベース同期とテーブル作成を確実に実行
    await sequelize.sync({ force });

    if (force) {
      console.log('✅ Database tables recreated (force mode)');
    } else {
      console.log('✅ Database tables synced');
    }

    // シーダーを実行
    await seedRolesAndPermissions();

    console.log('✅ All seeders completed successfully');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    throw error;
  }
}
