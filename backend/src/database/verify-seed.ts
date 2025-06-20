/**
 * シードデータの検証スクリプト
 * データが正しく作成されているかを確認します
 */

import dotenv from 'dotenv';
import sequelize from '../models/index';
import RoleModel from '../models/Role';
import PermissionModel from '../models/Permission';
import RolePermissionModel from '../models/RolePermission';

dotenv.config();

async function verifySeededData() {
  try {
    console.log('🔍 Verifying seeded data...');

    // データベース接続
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // ロール数確認
    const roleCount = await RoleModel.count();
    console.log(`📊 Total roles: ${roleCount}`);

    // 権限数確認
    const permissionCount = await PermissionModel.count();
    console.log(`📊 Total permissions: ${permissionCount}`);

    // ロール-権限マッピング数確認
    const mappingCount = await RolePermissionModel.count();
    console.log(`📊 Total role-permission mappings: ${mappingCount}`);

    // 各ロールの詳細表示
    const roles = await RoleModel.findAll();
    console.log('\n📋 Roles:');
    for (const role of roles) {
      console.log(`🎭 ${role.name} - ${role.description}`);
    }

    // 各権限の詳細表示
    const permissions = await PermissionModel.findAll();
    console.log('\n🔐 Permissions:');
    for (const permission of permissions) {
      console.log(`✓ ${permission.name} - ${permission.description}`);
    }

    console.log('\n✅ Verification completed successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  verifySeededData();
}
