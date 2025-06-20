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
