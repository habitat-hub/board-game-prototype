import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth';
import getProjects from './projects/getProjects';
import createProject from './projects/createProject';

const router = Router();

// ログインチェック
router.use(ensureAuthenticated);

router.use(getProjects);
router.use(createProject);

export default router;
