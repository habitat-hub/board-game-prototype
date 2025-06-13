import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeGroupModel from './PrototypeGroup';

class PrototypeModel extends Model {
  // ID
  public id!: string;
  // プロトタイプグループID
  public prototypeGroupId!: string;
  // プロトタイプ名
  public name!: string;
  // プロトタイプタイプ
  public type!: 'MASTER' | 'VERSION' | 'INSTANCE';
  // 最小プレイヤー数
  public minPlayers!: number;
  // 最大プレイヤー数
  public maxPlayers!: number;
  // バージョン番号
  public versionNumber!: number;
}

PrototypeModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    prototypeGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('MASTER', 'VERSION', 'INSTANCE'),
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
    versionNumber: {
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
        fields: ['prototypeGroupId'],
      },
    ],
  }
);

// PrototypeGroupとの関連付け
PrototypeModel.belongsTo(PrototypeGroupModel, {
  foreignKey: 'prototypeGroupId',
  onDelete: 'CASCADE',
});
PrototypeGroupModel.hasMany(PrototypeModel, {
  foreignKey: 'prototypeGroupId',
  onDelete: 'CASCADE',
});

export default PrototypeModel;
