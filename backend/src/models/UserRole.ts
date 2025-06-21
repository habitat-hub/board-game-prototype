import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import { RESOURCE_TYPES } from '../const';

// 関連モデルの型をインポート（循環参照を避けるため遅延インポートまたは型のみ）
import type UserModel from './User';
import type RoleModel from './Role';

class UserRoleModel extends Model {
  // ID（自動生成される主キー）
  public id!: number;
  // ユーザーID
  public userId!: string;
  // ロールID
  public roleId!: number;
  // リソースタイプ
  public resourceType!: string;
  // リソースID
  public resourceId!: string;

  // 関連モデル（eager loadingで取得される場合）
  public User?: UserModel;
  public Role?: RoleModel;
}

UserRoleModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [Object.values(RESOURCE_TYPES)],
      },
    },
    resourceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserRole',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'resourceType', 'resourceId'],
        name: 'user_role_resource_unique_constraint',
      },
      {
        fields: ['userId'],
        name: 'user_role_user_id_index',
      },
      {
        fields: ['roleId'],
        name: 'user_role_role_id_index',
      },
      {
        fields: ['userId', 'roleId', 'resourceType', 'resourceId'],
        name: 'user_role_full_index',
      },
    ],
  }
);

export default UserRoleModel;
