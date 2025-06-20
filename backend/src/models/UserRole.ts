import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import { RESOURCE_TYPES } from '../const';

class UserRoleModel extends Model {
  // ユーザーID
  public userId!: string;
  // ロールID
  public roleId!: number;
  // リソースタイプ
  public resourceType!: string;
  // リソースID
  public resourceId!: string;
}

UserRoleModel.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
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
      primaryKey: true,
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
      primaryKey: true,
      allowNull: false,
      validate: {
        isIn: [Object.values(RESOURCE_TYPES)],
      },
    },
    resourceId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserRole',
    timestamps: true,
    indexes: [
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
