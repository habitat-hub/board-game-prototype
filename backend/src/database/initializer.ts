import sequelize from '../models/index';
import RoleModel from '../models/Role';
import PermissionModel from '../models/Permission';
import RolePermissionModel from '../models/RolePermission';

/**
 * データベースが初期化されているかチェック
 * @returns テーブルが存在し、データが入っている場合はtrue
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // 重要なテーブルが存在し、初期データが入っているかチェック
    const [roleCount, permissionCount, mappingCount] = await Promise.all([
      RoleModel.count(),
      PermissionModel.count(),
      RolePermissionModel.count(),
    ]);

    // すべてのテーブルにデータが入っている場合のみ初期化済みとする
    const isInitialized =
      roleCount > 0 && permissionCount > 0 && mappingCount > 0;

    if (isInitialized) {
      console.log(
        `📊 Database status: ${roleCount} roles, ${permissionCount} permissions, ${mappingCount} mappings`
      );
    }

    return isInitialized;
  } catch {
    // テーブルが存在しない場合はfalseを返す
    console.log('📊 Database tables not found or empty');
    return false;
  }
}

/**
 * データベースの初期化とシードを実行
 * テーブルが存在しない場合のみ実行される
 */
export async function initializeDatabaseIfNeeded(): Promise<void> {
  try {
    console.log('🔍 Checking database initialization status...');

    const isInitialized = await isDatabaseInitialized();

    if (isInitialized) {
      console.log('✅ Database already initialized, skipping seed');
      return;
    }

    console.log('🚀 Database not initialized, running setup...');

    // アソシエーションを設定
    const { setupAssociations } = await import('./associations');
    setupAssociations();

    // テーブル作成を強制実行（初回のみ）
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database tables created/updated');

    // シードデータを実行
    const { seedRolesAndPermissions } = await import(
      './seeders/001-roles-and-permissions'
    );
    await seedRolesAndPermissions();

    console.log('✅ Database initialization completed successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
