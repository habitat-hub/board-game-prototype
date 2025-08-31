import { Request, Response } from 'express';
import UserModel from '../models/User';
import {
  listAccessibleProjects,
  createProjectService,
} from '../services/projectService';

export async function getProjects(req: Request, res: Response) {
  const user = req.user as UserModel;
  try {
    const projects = await listAccessibleProjects(user.id);
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
}

export async function createProject(req: Request, res: Response) {
  const user = req.user as UserModel;
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'プロトタイプ名が必要です' });
    return;
  }

  try {
    const project = await createProjectService({ userId: user.id, name });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '予期せぬエラーが発生しました' });
  }
}
