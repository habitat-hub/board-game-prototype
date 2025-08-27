import express, { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User';
import ProjectModel from '../models/Project';
import PrototypeModel from '../models/Prototype';
import PartModel from '../models/Part';
import { getNeedTutorial } from '../helpers/userHelper';
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

  if (String(currentUserId) !== String(userId)) {
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
      // allow optional limit param (default to 100) to avoid truncating search results
      const rawLimit = req.query.limit;
      const parsedLimit = rawLimit ? parseInt(String(rawLimit), 10) : 100;
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100;

      const suggestedUsers = await UserModel.findAll({
        where: { username: { [Op.iLike]: `%${username}%` } },
        limit,
        order: [['username', 'ASC']],
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
 * /api/users/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: ユーザー情報更新
 *     description: ユーザー名を更新します。
 *     parameters:
 *       - name: userId
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

/**
 * @swagger
 * /api/users/{userId}/need-tutorial:
 *   get:
 *     tags: [Users]
 *     summary: チュートリアル必要判定
 *     description: 指定されたユーザーがチュートリアルを表示すべきか判定します。
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: 判定するユーザーのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 判定結果を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 needTutorial:
 *                   type: boolean
 *       '401':
 *         description: アクセス権がありません
 *       '500':
 *         description: サーバーエラー
 */
router.get(
  '/:userId/need-tutorial',
  checkUserAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    try {
  const needTutorial = await getNeedTutorial({ userId });
  res.json({ needTutorial });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
