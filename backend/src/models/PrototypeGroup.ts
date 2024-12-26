import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';

class PrototypeGroupModel extends Model {
  public id!: string;
  public prototypeId!: string;
}

PrototypeGroupModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    prototypeId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PrototypeGroup',
    timestamps: false,
  }
);

PrototypeGroupModel.belongsTo(PrototypeModel, {
  foreignKey: 'prototypeId',
  onDelete: 'CASCADE',
});

export default PrototypeGroupModel;
