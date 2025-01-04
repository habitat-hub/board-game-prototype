import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import { ensureAuthenticated } from '../middlewares/auth';
import { Op } from 'sequelize';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: ユーザー管理API
 */

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     tags: [Users]
 *     summary: ユーザー検索
 *     description: ユーザー名でユーザーを検索します。
 *     parameters:
 *       - name: username
 *         in: query
 *         required: true
 *         description: 検索するユーザー名
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 検索結果を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
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
