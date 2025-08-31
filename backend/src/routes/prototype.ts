import express, { Request, Response } from 'express';
import { ensureAuthenticated } from '../middlewares/auth';
import {
  checkPrototypeReadPermission,
  checkPrototypeWritePermission,
  checkPrototypeDeletePermission,
} from '../middlewares/permissions';
import { UPDATABLE_PROTOTYPE_FIELDS } from '../const';
import PrototypeModel from '../models/Prototype';

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
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
      }

      res.json(prototype);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
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
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);

      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
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
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
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
  async (req: Request, res: Response) => {
    const prototypeId = req.params.prototypeId;

    try {
      const prototype = await PrototypeModel.findByPk(prototypeId);
      if (!prototype) {
        res.status(404).json({ error: 'プロトタイプが見つかりません' });
        return;
      }

      if (prototype.type === 'MASTER') {
        res.status(400).json({ error: 'マスタープロトタイプは削除できません' });
        return;
      }

      await PrototypeModel.destroy({ where: { id: prototypeId } });

      res.json({ message: 'プロトタイプを削除しました' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '予期せぬエラーが発生しました' });
    }
  }
);

export default router;
