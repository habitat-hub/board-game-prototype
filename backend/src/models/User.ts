import { DataTypes, Model } from 'sequelize';
import sequelize from './index';

class UserModel extends Model {
  public id!: string;
  public googleId!: string;
  public username!: string;
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    defaultScope: {
      attributes: { exclude: ['googleId'] },
    },
  }
);

export default UserModel;
