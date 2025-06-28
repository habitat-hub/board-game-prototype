import { Model, DataTypes } from 'sequelize';
import sequelize from './index';
import User from './User';

class ProjectModel extends Model {
  // ID
  public id!: string;
  // ユーザーID
  public userId!: string;
}

ProjectModel.init(
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
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Project',
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

ProjectModel.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});
User.hasMany(ProjectModel, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

export default ProjectModel;
