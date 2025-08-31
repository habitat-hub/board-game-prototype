import { Router } from 'express';
import { getProjects } from '../../controllers/projectController';

const router = Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: プロジェクト一覧取得
 *     description: ユーザーがアクセス可能なプロジェクトの一覧を取得します。
 *     responses:
 *       '200':
 *         description: アクセス可能なプロジェクトの一覧を返します
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   project:
 *                     $ref: '#/components/schemas/Project'
 *                   prototypes:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Prototype'
 */
router.get('/', getProjects);

export default router;
