import { DataTypes, Model } from 'sequelize';
import sequelize from './index';

class UserModel extends Model {
  public id!: number;
  public googleId!: string;
  public username!: string;
}

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
  }
);

export default UserModel;
