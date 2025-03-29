import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';

class PrototypeModel extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public type!: 'EDIT' | 'PREVIEW';
  public masterPrototypeId!: string | null;
  public groupId!: string;
  public minPlayers!: number;
  public maxPlayers!: number;
}

PrototypeModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('EDIT', 'PREVIEW'),
      allowNull: false,
    },
    masterPrototypeId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    minPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maxPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
        fields: ['userId'],
      },
      {
        fields: ['masterPrototypeId'],
      },
    ],
  }
);

PrototypeModel.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(PrototypeModel, { foreignKey: 'userId', onDelete: 'CASCADE' });
PrototypeModel.belongsTo(PrototypeModel, {
  as: 'masterPrototype',
  foreignKey: 'masterPrototypeId',
  onDelete: 'CASCADE',
});

export default PrototypeModel;
