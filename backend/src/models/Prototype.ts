import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';

class PrototypeModel extends Model {
  public id!: number;
  public userId!: number;
  public groupId!: number;
  public name!: string;
  public isEdit!: boolean;
  public isPreview!: boolean;
  public isPublic!: boolean;
}

PrototypeModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isPreview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Prototype',
  }
);

PrototypeModel.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PrototypeModel, { foreignKey: 'userId' });

export default PrototypeModel;
