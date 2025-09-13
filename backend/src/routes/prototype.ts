import express, { Request, Response, NextFunction } from 'express';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkPrototypeReadPermission,
  checkPrototypeWritePermission,
  checkPrototypeDeletePermission,
} from '../middlewares/permissions';
import {
  UPDATABLE_PROTOTYPE_FIELDS,
  PERMISSION_ACTIONS,
  RESOURCE_TYPES,
} from '../const';
import PrototypeModel from '../models/Prototype';
import { NotFoundError, ValidationError } from '../errors/CustomError';
import { hasPermission } from '../helpers/roleHelper';

const router = express.Router();

// ログインチェック
router.use(ensureAuthenticated);

/**
 * @swagger
 * tags:
 *   name: Prototypes
 *   description: プロトタイプ管理API
 */

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   get:
 *     tags: [Prototypes]
 *     summary: 特定のプロトタイプ取得
 *     description: 指定されたIDのプロトタイプを取得します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプを返します
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prototype:
 *                   $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.get(
  '/:prototypeId',
  checkPrototypeReadPermission,
  async (req: Request, res: Response, next: NextFunction) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        throw new NotFoundError('プロトタイプが見つかりません');
      }

      res.json(prototype);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   put:
 *     tags: [Prototypes]
 *     summary: プロトタイプ更新
 *     description: 指定されたIDのプロトタイプを更新します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               minPlayers:
 *                 type: integer
 *               maxPlayers:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: プロトタイプを更新しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prototype'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.put(
  '/:prototypeId',
  checkPrototypeWritePermission,
  async (req: Request, res: Response, next: NextFunction) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);

      if (!prototype) {
        throw new NotFoundError('プロトタイプが見つかりません');
      }

      // ルーム名（INSTANCEのname）変更は Admin（MANAGE）に限定
      const wantsRename = typeof req.body?.name !== 'undefined';
      if (wantsRename && prototype.type === 'INSTANCE') {
        const user = req.user as { id?: string } | undefined;
        const userId = String(user?.id || '');
        const isAdminForPrototype = await hasPermission(
          userId,
          RESOURCE_TYPES.PROTOTYPE,
          PERMISSION_ACTIONS.MANAGE,
          prototypeId
        );
        if (!isAdminForPrototype) {
          res.status(403).json({
            message: 'ルーム名の変更はAdminのみ可能です',
          });
          return;
        }
      }

      const updateData = Object.entries(req.body).reduce(
        (acc, [key, value]) => {
          if (
            value !== undefined &&
            UPDATABLE_PROTOTYPE_FIELDS.PROTOTYPE.includes(key)
          ) {
            return { ...acc, [key]: value };
          }
          return acc;
        },
        {} as Partial<PrototypeModel>
      );
      await PrototypeModel.update(updateData, { where: { id: prototypeId } });

      res.json(prototype);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/prototypes/{prototypeId}:
 *   delete:
 *     tags: [Prototypes]
 *     summary: プロトタイプ削除
 *     description: 指定されたIDのプロトタイプを削除します。
 *     parameters:
 *       - name: prototypeId
 *         in: path
 *         required: true
 *         description: プロトタイプのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: プロトタイプを削除しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '404':
 *         description: プロトタイプが見つかりません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 */
router.delete(
  '/:prototypeId',
  checkPrototypeDeletePermission,
  async (req: Request, res: Response, next: NextFunction) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        throw new NotFoundError('プロトタイプが見つかりません');
      }

      if (prototype.type === 'MASTER') {
        throw new ValidationError('マスタープロトタイプは削除できません');
      }

      await PrototypeModel.destroy({ where: { id: prototypeId } });

      res.json({ message: 'プロトタイプを削除しました' });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
);

export default router;
