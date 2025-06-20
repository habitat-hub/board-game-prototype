import { Model, DataTypes } from 'sequelize';
import sequelize from './index';

class RoleModel extends Model {
  // ID
  public id!: number;
  // ロール名
  public name!: string;
  // 説明
  public description!: string;
}

RoleModel.init(
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
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    timestamps: true,
  }
);

export default RoleModel;
