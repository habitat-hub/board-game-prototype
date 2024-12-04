import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import { ensureAuthenticated } from '../middlewares/auth';
import { Op } from 'sequelize';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

// ユーザー検索
router.get('/search', async (req: Request, res: Response) => {
  const { username } = req.query;

  // 10件まで取得
  const suggestedUsers = await UserModel.findAll({
    where: { username: { [Op.iLike]: `%${username}%` } },
    limit: 10,
  });
  res.json(suggestedUsers);
});

export default router;
