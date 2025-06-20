import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

class PermissionModel extends Model {
  // ID
  public id!: number;
  // 権限名
  public name!: string;
  // リソースタイプ
  public resource!: string;
  // アクション
  public action!: string;
  // 説明
  public description!: string;
}

PermissionModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    timestamps: true,
  }
);

export default PermissionModel;
