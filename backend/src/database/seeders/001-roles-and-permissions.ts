import RoleModel from '../../models/Role';
import PermissionModel from '../../models/Permission';
import RolePermissionModel from '../../models/RolePermission';
import { ROLE_TYPE, PERMISSION_ACTIONS, RESOURCE_TYPES } from '../../const';

/**
 * ロールと権限の初期データ定義
 */
const INITIAL_ROLES = [
  {
    name: ROLE_TYPE.ADMIN,
    description: 'システム管理者 - 全機能にアクセス可能',
  },
  {
    name: ROLE_TYPE.EDITOR,
    description: '編集者 - プロトタイプの作成・編集が可能',
  },
  {
    name: ROLE_TYPE.PLAYER,
    description: 'プレイヤー - プロトタイプでのゲームプレイが可能',
  },
  {
    name: ROLE_TYPE.VIEWER,
    description: '閲覧者 - プロトタイプの閲覧のみ可能',
  },
];

const INITIAL_PERMISSIONS = [
  // プロトタイプグループ関連
  {
    name: 'read_prototype_group',
    resource: RESOURCE_TYPES.PROTOTYPE_GROUP,
    action: PERMISSION_ACTIONS.READ,
    description: 'プロトタイプグループの閲覧',
  },
  {
    name: 'write_prototype_group',
    resource: RESOURCE_TYPES.PROTOTYPE_GROUP,
    action: PERMISSION_ACTIONS.WRITE,
    description: 'プロトタイプグループの編集',
  },
  {
    name: 'delete_prototype_group',
    resource: RESOURCE_TYPES.PROTOTYPE_GROUP,
    action: PERMISSION_ACTIONS.DELETE,
    description: 'プロトタイプグループの削除',
  },
  {
    name: 'manage_prototype_group',
    resource: RESOURCE_TYPES.PROTOTYPE_GROUP,
    action: PERMISSION_ACTIONS.MANAGE,
    description: 'プロトタイプグループの管理（メンバー招待など）',
  },
  // プロトタイプ関連
  {
    name: 'read_prototype',
    resource: RESOURCE_TYPES.PROTOTYPE,
    action: PERMISSION_ACTIONS.READ,
    description: 'プロトタイプの閲覧',
  },
  {
    name: 'write_prototype',
    resource: RESOURCE_TYPES.PROTOTYPE,
    action: PERMISSION_ACTIONS.WRITE,
    description: 'プロトタイプの編集',
  },
  {
    name: 'delete_prototype',
    resource: RESOURCE_TYPES.PROTOTYPE,
    action: PERMISSION_ACTIONS.DELETE,
    description: 'プロトタイプの削除',
  },
  {
    name: 'play_prototype',
    resource: RESOURCE_TYPES.PROTOTYPE,
    action: PERMISSION_ACTIONS.PLAY,
    description: 'プロトタイプでのゲームプレイ（パーツの移動、操作など）',
  },
  // ユーザー管理関連
  {
    name: 'read_user',
    resource: RESOURCE_TYPES.USER,
    action: PERMISSION_ACTIONS.READ,
    description: 'ユーザー情報の閲覧',
  },
  {
    name: 'manage_user',
    resource: RESOURCE_TYPES.USER,
    action: PERMISSION_ACTIONS.MANAGE,
    description: 'ユーザー管理',
  },
];

/**
 * ロールと権限のマッピング定義
 */
const ROLE_PERMISSION_MAPPING = {
  [ROLE_TYPE.ADMIN]: 'ALL', // 全権限
  [ROLE_TYPE.EDITOR]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.WRITE],
  [ROLE_TYPE.PLAYER]: [PERMISSION_ACTIONS.READ, PERMISSION_ACTIONS.PLAY],
  [ROLE_TYPE.VIEWER]: [PERMISSION_ACTIONS.READ],
};

/**
 * ロールと権限を作成する関数
 * 冪等性を保証し、何度実行しても安全
 */
export async function seedRolesAndPermissions() {
  try {
    console.log('Creating initial roles...');

    // ロールを作成
    const roles = new Map();
    for (const roleData of INITIAL_ROLES) {
      const [role, created] = await RoleModel.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      });
      roles.set(roleData.name, role);

      if (created) {
        console.log(`✓ Role created: ${roleData.name}`);
      } else {
        console.log(`✓ Role found: ${roleData.name}`);
      }
    }

    console.log('Creating initial permissions...');

    // 権限を作成
    const permissions = new Map();
    for (const permissionData of INITIAL_PERMISSIONS) {
      const [permission, created] = await PermissionModel.findOrCreate({
        where: { name: permissionData.name },
        defaults: permissionData,
      });
      permissions.set(permissionData.name, permission);

      if (created) {
        console.log(`✓ Permission created: ${permissionData.name}`);
      } else {
        console.log(`✓ Permission found: ${permissionData.name}`);
      }
    }

    console.log('Creating role-permission mappings...');

    // ロールと権限の関連付け
    let mappingsCreated = 0;
    let mappingsExisting = 0;

    for (const [roleName, allowedActions] of Object.entries(
      ROLE_PERMISSION_MAPPING
    )) {
      const role = roles.get(roleName);
      if (!role) {
        console.warn(`⚠️ Role not found: ${roleName}`);
        continue;
      }

      const rolePermissions = [];

      if (allowedActions === 'ALL') {
        // 管理者は全権限
        rolePermissions.push(...Array.from(permissions.values()));
      } else {
        // 指定されたアクションの権限のみ
        for (const permission of permissions.values()) {
          if (allowedActions.includes(permission.action)) {
            rolePermissions.push(permission);
          }
        }
      }

      // ロール-権限の関連付けを作成
      for (const permission of rolePermissions) {
        const [, created] = await RolePermissionModel.findOrCreate({
          where: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });

        if (created) {
          mappingsCreated++;
          console.log(
            `✓ Role-Permission mapping created: ${roleName} -> ${permission.name}`
          );
        } else {
          mappingsExisting++;
        }
      }
    }

    console.log(`✅ Roles and permissions seeding completed successfully`);
    console.log(`   - ${roles.size} roles processed`);
    console.log(`   - ${permissions.size} permissions processed`);
    console.log(`   - ${mappingsCreated} new mappings created`);
    console.log(`   - ${mappingsExisting} existing mappings found`);
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  }
}
