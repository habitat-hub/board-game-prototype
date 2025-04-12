import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';

class PrototypeModel extends Model {
  // ID
  public id!: string;
  // ユーザーID
  public userId!: string;
  // 名前
  public name!: string;
  // タイプ
  public type!: 'EDIT' | 'PREVIEW';
  // マスタープロトタイプID
  public masterPrototypeId!: string | null;
  // グループID
  public groupId!: string;
  // 最小プレイヤー数
  public minPlayers!: number;
  // 最大プレイヤー数
  public maxPlayers!: number;
}

PrototypeModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('EDIT', 'PREVIEW'),
      allowNull: false,
    },
    masterPrototypeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    minPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Prototype',
    indexes: [
      {
        unique: true,
        fields: ['id'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['masterPrototypeId'],
      },
    ],
  }
);

PrototypeModel.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(PrototypeModel, { foreignKey: 'userId', onDelete: 'CASCADE' });
PrototypeModel.belongsTo(PrototypeModel, {
  as: 'masterPrototype',
  foreignKey: 'masterPrototypeId',
  onDelete: 'CASCADE',
});

export default PrototypeModel;
