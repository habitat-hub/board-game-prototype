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
    ],
  }
);

PrototypeModel.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(PrototypeModel, { foreignKey: 'userId', onDelete: 'CASCADE' });

export default PrototypeModel;
