import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';
import PrototypeModel from './Prototype';

class Access extends Model {
  public userId!: number;
  public prototypeId!: number;
}

Access.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    prototypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PrototypeModel,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Access',
  }
);

User.belongsToMany(PrototypeModel, { through: Access, foreignKey: 'userId' });
PrototypeModel.belongsToMany(User, {
  through: Access,
  foreignKey: 'prototypeId',
});

export default Access;
