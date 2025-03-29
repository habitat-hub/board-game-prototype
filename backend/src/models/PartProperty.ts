import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PartModel from './Part';

// パーツの設定値を管理
class PartPropertyModel extends Model {
  // ID
  public id!: number;
  // パーツID
  public partId!: number;
  // 面
  public side!: 'front' | 'back';
  // 名前
  public name!: string;
  // 説明
  public description!: string;
  // 色
  public color!: string;
  public image?: string;
}

PartPropertyModel.init(
  {
    partId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'Parts',
        key: 'id',
      },
    },
    side: {
      type: DataTypes.ENUM('front', 'back'),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'PartProperty',
  }
);

// リレーションの定義
PartPropertyModel.belongsTo(PartModel, {
  foreignKey: 'partId',
  onDelete: 'CASCADE',
});

PartModel.hasMany(PartPropertyModel, {
  foreignKey: 'partId',
  as: 'partProperties',
});

export default PartPropertyModel;
