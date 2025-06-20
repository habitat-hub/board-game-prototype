import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

class RolePermissionModel extends Model {
  // ロールID
  public roleId!: number;
  // 権限ID
  public permissionId!: number;
}

RolePermissionModel.init(
  {
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    permissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'RolePermissions',
    timestamps: false,
  }
);

export default RolePermissionModel;
