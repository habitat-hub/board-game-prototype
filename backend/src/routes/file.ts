import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadFileToS3 } from '../services/fileUploadService';
import { fetchFileFromS3 } from '../services/fileFetchService';
import { cleanupFileIfUnused } from '../services/fileCleanupService';
import { pipeline } from 'stream/promises';

import FileModel from '../models/File';
import UserModel from '../models/User';
import { ValidationError, UnauthorizedError } from '../errors/CustomError';
import { fetchPartsAndProperties } from '../socket/prototypeHandler';
import { checkFileAccess } from '../middlewares/checkFileAccess';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: ファイル管理API
 */

/**
 * @swagger
 * /api/files:
 *   post:
 *     tags: [Files]
 *     summary: ファイルアップロード
 *     description: S3にファイルをアップロードし、ファイルのメタデータを保存します。
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: アップロードするファイル
 *     responses:
 *       '201':
 *         description: ファイルが正常にアップロードされました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/File'
 *       '400':
 *         description: アップロード対象のファイルが存在しない、またはサポートされていない形式です
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
 *         description: ファイルのアップロードに失敗しました
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req || !req.file) {
        throw new ValidationError('アップロード対象のファイルが存在しません');
      }
      if (!req.user) {
        throw new UnauthorizedError('認証されていないユーザーです');
      }
      const uploadResult = await uploadFileToS3(req.file);
      const uploaderUserId = (req.user as UserModel).id;

      const file = await FileModel.create({
        displayName: uploadResult.displayName,
        storagePath: uploadResult.storagePath,
        contentType: uploadResult.contentType,
        fileSize: uploadResult.fileSize,
        uploaderUserId: uploaderUserId,
      });

      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     tags: [Files]
 *     summary: ファイル取得
 *     description: S3から指定されたファイルを取得し、ファイルデータを直接返します。
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         description: 取得するファイルのID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: ファイルが正常に取得されました
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       '400':
 *         description: File ID が指定されていない、またはリクエストが不正です
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
 *         description: 指定されたファイルが存在しません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: ファイルを取得できませんでした
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.get(
  '/:fileId',
  checkFileAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = res.locals.file as FileModel;
      const fileData = await fetchFileFromS3(file.storagePath);
      res.set('Content-Type', file.contentType);
      await pipeline(fileData, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     tags: [Files]
 *     summary: ファイル削除
 *     description: S3から指定されたファイルを削除します。
 *     parameters:
 *       - name: fileId
 *         in: path
 *         required: true
 *         description: 削除するファイルのID
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
 *         description: ファイルが正常に削除されました
 *       '400':
 *         description: File ID が指定されていない、またはリクエストが不正です
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
 *         description: 指定されたファイルが存在しません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error404Response'
 *       '500':
 *         description: ファイルを削除できませんでした
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.delete(
  '/:fileId',
  checkFileAccess,
  async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;
    const { prototypeId, partId, side, emitUpdate } = req.query;
    try {
      if (!prototypeId || !partId || !side) {
        throw new ValidationError('prototypeId、partId、sideの指定が必要です');
      }
      const result = await cleanupFileIfUnused(
        fileId,
        String(partId),
        side as 'front' | 'back'
      );
      // UPDATE_PARTSをemit
      const io = req.app.get('io');
      if (io && emitUpdate === 'true') {
        const { parts, properties } = await fetchPartsAndProperties(
          prototypeId as string
        );

        io.to(prototypeId as string).emit('UPDATE_PARTS', {
          parts,
          properties,
        });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
