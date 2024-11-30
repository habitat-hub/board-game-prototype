import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';

class PartModel extends Model {
  public id!: number;
  public type!: string;
  public prototypeId!: number;
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

  async clone({ newPrototypeId }: { newPrototypeId: number }) {
    return PartModel.create({
      type: this.type,
      prototypeId: newPrototypeId,
      parentId: this.parentId,
      name: this.name,
      description: this.description,
      color: this.color,
      position: this.position,
      width: this.width,
      height: this.height,
      order: this.order,
      configurableTypeAsChild: this.configurableTypeAsChild,
      isReversible: this.isReversible,
      isFlipped: this.isFlipped,
      ownerId: this.ownerId,
    });
  }
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
    prototypeId: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    modelName: 'Part',
  }
);

PartModel.belongsTo(PrototypeModel, { foreignKey: 'prototypeId' });
PrototypeModel.hasMany(PartModel, { foreignKey: 'prototypeId' });

export default PartModel;
