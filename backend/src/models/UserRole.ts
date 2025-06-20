import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import { RESOURCE_TYPES } from '../const';

// 関連モデルの型をインポート（循環参照を避けるため遅延インポートまたは型のみ）
import type UserModel from './User';
import type RoleModel from './Role';

class UserRoleModel extends Model {
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
        fields: ['userId', 'roleId', 'resourceType', 'resourceId'],
        name: 'user_role_resource_unique',
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['roleId'],
      },
      {
        fields: ['userId', 'resourceType', 'resourceId'],
      },
    ],
  }
);

export default UserRoleModel;
