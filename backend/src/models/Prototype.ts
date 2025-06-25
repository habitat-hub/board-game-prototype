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
  // 紐付くバージョンID（INSTANCE用）
  public sourceVersionPrototypeId?: string;
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
      references: {
        model: 'PrototypeGroups',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    sourceVersionPrototypeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Prototypes',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'このインスタンスがどのバージョンから作られたか',
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
