import { Router } from 'express';
import { createProject } from '../../controllers/projectController';

const router = Router();

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: プロジェクト作成
 *     description: 新しいプロジェクトを作成します。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       '201':
 *         description: 新しいプロジェクトを作成しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '400':
 *         description: リクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '500':
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post('/', createProject);

export default router;
