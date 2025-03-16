import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PartModel from './Part';

// パーツの設定値を管理
class PartPropertyModel extends Model {
  public id!: number;
  public partId!: number;
  public side!: 'front' | 'back';
  public name!: string;
  public description!: string;
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
