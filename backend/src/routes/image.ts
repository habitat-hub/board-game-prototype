import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImageToS3 } from '../services/imageUploadService';
import { fetchImageFromS3 } from '../services/imageFetchService';
import { cleanupImageIfUnused } from '../services/imageCleanupService';
import { pipeline } from 'stream/promises';

import ImageModel from '../models/Image';
import UserModel from '../models/User'; // Import UserModel
import {
  ValidationError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/CustomError';
import { emitUpdatedPartsAndProperties } from '../socket/prototypeHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // バッファとして読み込み

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: 画像管理API
 */

/**
 * @swagger
 * /api/images:
 *   post:
 *     tags: [Images]
 *     summary: 画像アップロード
 *     description: S3に画像をアップロードし、画像のメタデータを保存します。
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: アップロードする画像ファイル
 *     responses:
 *       '201':
 *         description: 画像が正常にアップロードされました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/Image'
 *       '400':
 *         description: アップロード対象の画像が存在しない、またはサポートされていない画像形式です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '401':
 *         description: 認証されていないユーザーです
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/Error401Response'
 *       '500':
 *         description: 画像のアップロードに失敗しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req || !req.file) {
        throw new ValidationError('アップロード対象の画像が存在しません');
      }
      if (!req.user) {
        throw new UnauthorizedError('認証されていないユーザーです');
      }
      const uploadResult = await uploadImageToS3(req.file);
      const uploaderUserId = (req.user as UserModel).id;

      const image = await ImageModel.create({
        displayName: uploadResult.displayName,
        storagePath: uploadResult.storagePath,
        contentType: uploadResult.contentType,
        fileSize: uploadResult.fileSize,
        uploaderUserId: uploaderUserId,
      });

      res.status(201).json(image);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/images/{imageId}:
 *   get:
 *     tags: [Images]
 *     summary: 画像取得
 *     description: S3から指定された画像を取得し、画像データを直接返します。
 *     parameters:
 *       - name: imageId
 *         in: path
 *         required: true
 *         description: 取得する画像のID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: 画像が正常に取得されました
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: Image ID が指定されていない、またはリクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '401':
 *         description: 認証されていないユーザーです
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401Response'
 *       '404':
 *         description: 指定された画像が存在しません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: 画像を取得できませんでした
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.get(
  '/:imageId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { imageId } = req.params;
    try {
      if (!imageId) {
        throw new ValidationError('Image ID が指定されていません');
      }
      // TODO: 画像のアクセス権を確認するロジックを追加(例: ユーザーがその画像にアクセスできるかどうか)
      // ここでは単純にユーザーが認証されているかどうかを確認
      if (!req.user) {
        throw new UnauthorizedError('認証されていないユーザーです');
      }

      const image = await ImageModel.findByPk(imageId);
      if (!image) {
        throw new NotFoundError('指定された画像が存在しません');
      }
      const imageData = await fetchImageFromS3(image.storagePath);
      res.set('Content-Type', image.contentType);

      // pipelineでストリームを処理
      await pipeline(imageData, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/images/{imageId}:
 *   delete:
 *     tags: [Images]
 *     summary: 画像削除
 *     description: S3から指定された画像を削除します。
 *     parameters:
 *       - name: imageId
 *         in: path
 *         required: true
 *         description: 削除する画像のID
 *         schema:
 *           type: string
 *       - name: prototypeId
 *         in: query
 *         required: true
 *         description: プロトタイプID
 *         schema:
 *           type: string
 *       - name: partId
 *         in: query
 *         required: true
 *         description: パーツID
 *         schema:
 *           type: number
 *       - name: side
 *         in: query
 *         required: true
 *         description: 面（front または back）
 *         schema:
 *           type: string
 *           enum: [front, back]
 *       - name: emitUpdate
 *         in: query
 *         required: true
 *         description: 更新をemitするかどうか（デフォルトはfalse）
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *     responses:
 *       '200':
 *         description: 画像が正常に削除されました
 *       '400':
 *         description: Image ID が指定されていない、またはリクエストが不正です
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error400Response'
 *       '401':
 *         description: 認証されていないユーザーです
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error401Response'
 *       '404':
 *         description: 指定された画像が存在しません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: 画像を削除できませんでした
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.delete(
  '/:imageId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { imageId } = req.params;
    const { prototypeId, partId, side, emitUpdate } = req.query; // クエリパラメータから取得
    try {
      if (!imageId) {
        throw new ValidationError('Image ID が指定されていません');
      }

      if (!prototypeId || !partId || !side) {
        throw new ValidationError('partId、sideおよびsideの指定が必要です');
      }
      // TODO: 画像のアクセス権を確認するロジックを追加(例: ユーザーがその画像にアクセスできるかどうか)
      // ここでは単純にユーザーが認証されているかどうかを確認
      if (!req.user) {
        throw new UnauthorizedError('認証されていないユーザーです');
      }
      const image = await ImageModel.findByPk(imageId);
      if (!image) {
        throw new NotFoundError('指定された画像が存在しません');
      }
      const result = await cleanupImageIfUnused(
        imageId,
        partId as string,
        side as 'front' | 'back'
      );
      // UPDATE_PARTSをemit
      const io = req.app.get('io');
      if (io && emitUpdate === 'true') {
        // emitUpdateが"true"の場合はemitする
        emitUpdatedPartsAndProperties(io, prototypeId as string);
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
