import sequelize from '../models';
import { getAccessiblePrototypes } from '../helpers/prototypeHelper';
import { createProject } from '../factories/prototypeFactory';

type CreateProjectParams = {
  userId: string;
  name: string;
};

export async function listAccessibleProjects(userId: string) {
  return getAccessiblePrototypes({ userId });
}

export async function createProjectService({
  userId,
  name,
}: CreateProjectParams) {
  const transaction = await sequelize.transaction();
  try {
    const project = await createProject({
      userId,
      name,
      transaction,
    });
    await transaction.commit();
    return project;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
