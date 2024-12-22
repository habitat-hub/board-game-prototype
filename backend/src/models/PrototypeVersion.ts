import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';

class PrototypeVersionModel extends Model {
  public id!: string;
  public prototypeId!: string;
  public versionNumber!: string;
  public description!: string | null;
}

PrototypeVersionModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    prototypeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    versionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'PrototypeVersion',
    indexes: [
      {
        unique: true,
        fields: ['id'],
      },
      {
        unique: true,
        fields: ['versionNumber', 'prototypeId'],
      },
    ],
  }
);

// Prototypeとの関連付け
PrototypeVersionModel.belongsTo(PrototypeModel, {
  foreignKey: 'prototypeId',
  onDelete: 'CASCADE',
});
PrototypeModel.hasMany(PrototypeVersionModel, {
  foreignKey: 'prototypeId',
  onDelete: 'CASCADE',
});

export default PrototypeVersionModel;