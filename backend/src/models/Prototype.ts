import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import ProjectModel from './Project';

class PrototypeModel extends Model {
  // ID
  public id!: string;
  // プロジェクトID
  public projectId!: string;
  // プロトタイプ名
  public name!: string;
  // プロトタイプタイプ
  public type!: 'MASTER' | 'VERSION' | 'INSTANCE';
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
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Projects',
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
        fields: ['projectId'],
      },
    ],
  }
);

// Projectとの関連付け
PrototypeModel.belongsTo(ProjectModel, {
  foreignKey: 'projectId',
  as: 'project',
  onDelete: 'CASCADE',
});
ProjectModel.hasMany(PrototypeModel, {
  foreignKey: 'projectId',
  as: 'prototypes',
  onDelete: 'CASCADE',
});

export default PrototypeModel;
