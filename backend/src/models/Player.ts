import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import PrototypeModel from './Prototype';

class PlayerModel extends Model {
  public id!: number;
  public name!: string;
  public prototypeId!: number;
}

PlayerModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prototypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Player',
  }
);

PlayerModel.belongsTo(PrototypeModel, { foreignKey: 'prototypeId' });
PrototypeModel.hasMany(PlayerModel, {
  foreignKey: 'prototypeId',
  as: 'players',
  onDelete: 'CASCADE',
});

export default PlayerModel;
