import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeVersionModel from './PrototypeVersion';

class PlayerModel extends Model {
  public id!: number;
  public prototypeVersionId!: string;
  public playerName!: string;
  public originalPlayerId!: string | null;
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
    playerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalPlayerId: {
      type: DataTypes.UUID,
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

export default PlayerModel;
