import { Request, Response, NextFunction } from 'express';

/**
 * 認証されているかどうかを確認する
 * @param req - リクエスト
 * @param res - レスポンス
 * @param next - 次のミドルウェアを呼び出す
 * @returns
 */
export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ログイン済みの場合
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({ message: '権限がありません' });
  return;
}
