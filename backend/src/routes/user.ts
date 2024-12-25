import express, { Request, Response } from 'express';
import UserModel from '../models/User';
import { ensureAuthenticated } from '../middlewares/auth';
import { Op } from 'sequelize';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: ユーザー情報取得
 *     description: 現在ログインしているユーザーの情報を取得します。
 *     responses:
 *       '200':
 *         description: ユーザー情報を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *             examples:
 *               authenticated:
 *                 summary: 認証済みユーザー
 *                 value:
 *                   id: 1
 *                   username: "exampleUser"
 */
router.get('/info', (req, res) => {
  const user = req.user as UserModel;
  res.json({
    id: user.id,
    username: user.username,
  });
});

/**
 * @swagger
 * /user/search:
 *   get:
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
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *             examples:
 *               search:
 *                 summary: 検索結果
 *                 value:
 *                   - id: 1
 *                     googleId: "exampleGoogleId"
 *                     username: "exampleUser"
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
