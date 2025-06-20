import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

class UserPermissionModel extends Model {
  // ユーザーID
  public userId!: string;
  // 権限ID
  public permissionId!: number;
}

UserPermissionModel.init(
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
    permissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'UserPermission',
    tableName: 'UserPermissions',
    timestamps: false,
  }
);

export default UserPermissionModel;
