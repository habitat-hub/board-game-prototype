import { Router } from 'express';
import passport from 'passport';
import UserModel from '../models/User';

const router = Router();

// Googleログイン
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Googleログインコールバック
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/prototypes`);
  }
);

// ログアウト
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

// ユーザー情報取得
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user as UserModel;
    res.json({
      id: user.id,
      username: user.username,
    });
  } else {
    // ログインしていない場合、空のオブジェクトを返す
    res.json({});
  }
});

export default router;
