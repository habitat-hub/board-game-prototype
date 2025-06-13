import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';

class PrototypeGroupModel extends Model {
  // ID
  public id!: string;
  // ユーザーID
  public userId!: string;
}

PrototypeGroupModel.init(
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
  },
  {
    sequelize,
    modelName: 'PrototypeGroup',
    indexes: [
      {
        unique: true,
        fields: ['id'],
      },
      {
        fields: ['userId'],
      },
    ],
  }
);

PrototypeGroupModel.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
User.hasMany(PrototypeGroupModel, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

export default PrototypeGroupModel;
