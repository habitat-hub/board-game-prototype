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
        `Database status: ${roleCount} roles, ${permissionCount} permissions, ${mappingCount} mappings`
      );
    } else {
      console.log(
        `Database incomplete: ${roleCount} roles, ${permissionCount} permissions, ${mappingCount} mappings`
      );
    }

    return isInitialized;
  } catch {
    // テーブルが存在しない場合はfalseを返す（これは初回起動時の正常な動作）
    console.log('Database tables not found - this is expected on first run');
    return false;
  }
}

/**
 * データベースの初期化とシードを実行
 * データが不足している場合のみ実行される
 */
export async function initializeDatabaseIfNeeded(): Promise<void> {
  try {
    console.log('Checking database initialization status...');

    const isInitialized = await isDatabaseInitialized();

    if (isInitialized) {
      console.log('Database already initialized, skipping seed');
      return;
    }

    console.log('Database not initialized, running setup...');

    // データベースを安全にsync
    await sequelize.sync({ force: false, alter: false });
    console.log('Database tables created/updated');

    // シードデータを実行
    const { seedRolesAndPermissions } = await import(
      './seeders/001-roles-and-permissions'
    );
    await seedRolesAndPermissions();

    // 実行後の検証
    const finalCheck = await isDatabaseInitialized();
    if (finalCheck) {
      console.log(
        'Database initialization completed and verified successfully'
      );
    } else {
      throw new Error('Database initialization verification failed');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
