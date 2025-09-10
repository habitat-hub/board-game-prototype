import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PartModel from './Part';
import FileModel from './File';

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
  // 背景色
  public color!: string;
  // テキスト色
  public textColor!: string;
  // ファイル
  public fileId?: string;
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
    textColor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileId: {
      type: DataTypes.UUID,
      references: {
        model: 'Files',
        key: 'id',
      },
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
  as: 'part',
});

PartModel.hasMany(PartPropertyModel, {
  foreignKey: 'partId',
  as: 'partProperties',
});

PartPropertyModel.belongsTo(FileModel, {
  foreignKey: 'fileId',
  onDelete: 'SET NULL',
  as: 'file',
});

FileModel.hasMany(PartPropertyModel, {
  foreignKey: 'fileId',
  as: 'files',
});

export default PartPropertyModel;
