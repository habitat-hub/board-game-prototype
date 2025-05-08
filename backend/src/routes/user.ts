import express, { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import { ensureAuthenticated } from '../middlewares/auth';
import { Op } from 'sequelize';
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/CustomError';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

// ユーザー自身のリソースへのアクセスを確認するミドルウェア
const checkUserAccess = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  const currentUserId = (req.user as UserModel).id;

  if (currentUserId !== userId) {
    return next(
      new UnauthorizedError('自分自身のプロフィールのみ更新可能です')
    );
  }
  next();
};

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
router.get(
  '/search',
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.query;

    try {
      // 10件まで取得
      const suggestedUsers = await UserModel.findAll({
        where: { username: { [Op.iLike]: `%${username}%` } },
        limit: 10,
      });

      res.json(suggestedUsers);
    } catch (error) {
      console.error('Error during user search:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: ユーザー情報更新
 *     description: ユーザー名を更新します。
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: 更新するユーザーのID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: 新しいユーザー名
 *     responses:
 *       '200':
 *         description: ユーザー情報が更新されました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: リクエストが不正です
 *       '401':
 *         description: アクセス権がありません
 *       '404':
 *         description: ユーザーが見つかりません
 *       '500':
 *         description: サーバーエラー
 */
router.put(
  '/:userId',
  checkUserAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { username } = req.body;

    try {
      if (!username) {
        throw new ValidationError('ユーザー名は必須項目です');
      }

      // ユーザーが存在するか確認
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new NotFoundError('ユーザーが見つかりません');
      }

      // ユーザー名を更新
      user.username = username;
      await user.save();

      // 更新したユーザー情報を返す
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
