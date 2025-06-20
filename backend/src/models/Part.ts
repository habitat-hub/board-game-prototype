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
  // 親パーツID
  public parentId!: number | null;
  // 位置
  public position!: { x: number; y: number };
  // 幅
  public width!: number;
  // 高さ
  public height!: number;
  // 表示順
  public order!: number;
  // 子パーツとして設定可能なパーツタイプ
  public configurableTypeAsChild!: string[];
  // 元のパーツID
  public originalPartId: number | undefined;
  /**
   * カード
   */
  // 裏返し可能か
  public isReversible: boolean | undefined;
  // 裏向きか
  public isFlipped: boolean | undefined;
  /**
   * 手札
   */
  // 所有者ID (ユーザーID)
  public ownerId: string | undefined;
  /**
   * 山札
   */
  // 山札の上でカードを裏返し可能か
  public canReverseCardOnDeck: boolean | undefined;
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
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    configurableTypeAsChild: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    originalPartId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isReversible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isFlipped: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    canReverseCardOnDeck: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
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
