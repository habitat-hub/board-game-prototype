import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import UserModel from './User';
import AccessModel from './Access';

class UserAccessModel extends Model {
  public userId!: string;
  public accessId!: number;
}

UserAccessModel.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    accessId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserAccess',
    timestamps: false,
  }
);

UserModel.belongsToMany(AccessModel, {
  through: UserAccessModel,
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
AccessModel.belongsToMany(UserModel, {
  through: UserAccessModel,
  foreignKey: 'accessId',
  onDelete: 'CASCADE',
});

export default UserAccessModel;
