import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeVersionModel from './PrototypeVersion';
import UserModel from './User';

class PlayerModel extends Model {
  // ID
  public id!: number;
  // プロトタイプバージョンID
  public prototypeVersionId!: string;
  // ユーザーID
  public userId!: number | null;
  // プレイヤー名
  public playerName!: string;
  // 元のプレイヤーID
  public originalPlayerId!: number | null;
}

PlayerModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
