import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeVersionModel from './PrototypeVersion';

class PartModel extends Model {
  public id!: number;
  public type!: string;
  public prototypeVersionId!: string;
  public parentId!: number | null;
  public name!: string;
  public description!: string;
  public color!: string;
  public position!: { x: number; y: number };
  public width!: number;
  public height!: number;
  public order!: number;
  public configurableTypeAsChild!: string[];
  public isReversible: boolean | undefined;
  public isFlipped: boolean | undefined;
  public ownerId: number | undefined;
  public canReverseCardOnDeck: boolean | undefined;
  public originalPartId: number | undefined;
}

PartModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prototypeVersionId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    isReversible: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    isFlipped: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    canReverseCardOnDeck: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    originalPartId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Part',
  }
);

PartModel.belongsTo(PrototypeVersionModel, {
  foreignKey: 'prototypeVersionId',
  onDelete: 'CASCADE',
});
PrototypeVersionModel.hasMany(PartModel, {
  foreignKey: 'prototypeVersionId',
});

export default PartModel;
