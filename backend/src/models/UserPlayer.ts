import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import UserModel from './User';
import PlayerModel from './Player';

class UserPlayerModel extends Model {
  public userId!: string;
  public playerId!: number;
}

UserPlayerModel.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    playerId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'UserPlayer',
    timestamps: false,
  }
);

UserModel.belongsToMany(PlayerModel, {
  through: UserPlayerModel,
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
PlayerModel.belongsToMany(UserModel, {
  through: UserPlayerModel,
  foreignKey: 'playerId',
  onDelete: 'CASCADE',
});

export default UserPlayerModel;
