import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';
import UserModel from './User';

class PartModel extends Model {
  // ID
  public id!: number;
  // タイプ
  public type!: 'token' | 'card' | 'hand' | 'deck' | 'area';
  // プロトタイプID
  public prototypeId!: string;
  // 位置
  public position!: { x: number; y: number };
  // 幅
  public width!: number;
  // 高さ
  public height!: number;
  // 表示順
  public order!: number;
  /**
   * カード
   */
  // 表面
  public frontSide!: 'front' | 'back';
  /**
   * 手札
   */
  // 所有者ID (ユーザーID)
  public ownerId: string | null | undefined;
}

PartModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('token', 'card', 'hand', 'deck', 'area'),
      allowNull: false,
    },
    prototypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Prototypes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    position: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    order: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    frontSide: {
      type: DataTypes.ENUM('front', 'back'),
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Part',
  }
);

PartModel.belongsTo(PrototypeModel, {
  foreignKey: 'prototypeId',
  onDelete: 'CASCADE',
});
PrototypeModel.hasMany(PartModel, {
  foreignKey: 'prototypeId',
});

PartModel.belongsTo(UserModel, {
  foreignKey: 'ownerId',
  onDelete: 'SET NULL',
});
UserModel.hasMany(PartModel, {
  foreignKey: 'ownerId',
  onDelete: 'SET NULL',
});

export default PartModel;
