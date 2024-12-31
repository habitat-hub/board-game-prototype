import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeVersionModel from './PrototypeVersion';
import UserModel from './User';

class PlayerModel extends Model {
  public id!: number;
  public prototypeVersionId!: string;
  public userId!: number | null;
  public playerName!: string;
  public originalPlayerId!: number | null;
}

PlayerModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    prototypeVersionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    playerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalPlayerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Player',
    indexes: [
      {
        unique: true,
        fields: ['id'],
      },
      {
        fields: ['prototypeVersionId'],
      },
    ],
  }
);

PlayerModel.belongsTo(PrototypeVersionModel, {
  foreignKey: 'prototypeVersionId',
  onDelete: 'CASCADE',
});
PrototypeVersionModel.hasMany(PlayerModel, {
  foreignKey: 'prototypeVersionId',
  onDelete: 'CASCADE',
});

PlayerModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
UserModel.hasMany(PlayerModel, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

export default PlayerModel;
