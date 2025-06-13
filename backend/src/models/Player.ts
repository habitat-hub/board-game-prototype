import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';
import UserModel from './User';

class PlayerModel extends Model {
  // ID
  public id!: number;
  // プロトタイプID
  public prototypeId!: string;
  // ユーザーID
  public userId!: string | null;
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
    prototypeId: {
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
        fields: ['prototypeId'],
      },
    ],
  }
);

PlayerModel.belongsTo(PrototypeModel, {
  foreignKey: 'prototypeId',
  onDelete: 'CASCADE',
});
PrototypeModel.hasMany(PlayerModel, {
  foreignKey: 'prototypeId',
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
