import { Router } from 'express';
import passport from 'passport';
import UserModel from '../models/User';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 認証関連のAPI
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Googleログイン
 *     description: Googleアカウントを使用してログインします。
 *     responses:
 *       '302':
 *         description: リダイレクト
 *         headers:
 *           Location:
 *             description: リダイレクト先のURL
 *             schema:
 *               type: string
 *             example: https://accounts.google.com/o/oauth2/auth
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Googleログインコールバック
 *     description: GoogleログインのコールバックURL。
 *     responses:
 *       '302':
 *         description: ログイン成功時にリダイレクト
 *         headers:
 *           Location:
 *             description: リダイレクト先のURL
 *             schema:
 *               type: string
 *             example: http://localhost:3000/prototypes
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/prototypes`);
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: ログアウト
 *     description: 現在のセッションを終了し、ユーザーをログアウトします。
 *     responses:
 *       '200':
 *         description: ログアウト成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '500':
 *         description: ログアウト失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error500Response'
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to destroy session during logout:', err);
        res.status(500).json({ error: 'Failed to destroy session' });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

/**
 * @swagger
 * /auth/user:
 *   get:
 *     tags: [Auth]
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
 *                   type: string
 *                 username:
 *                   type: string
 */
router.get('/user', (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const user = req.user as UserModel;
      res.json({
        id: user.id,
        username: user.username,
      });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
