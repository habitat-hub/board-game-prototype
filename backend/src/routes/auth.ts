import { Router } from 'express';
import passport from 'passport';

const router = Router();

// Googleログインルート
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Googleログインコールバックルート
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.FRONTEND_URL,
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/prototypes`);
  }
);

// ログアウトルート
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

// ユーザー情報取得ルート
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    // ユーザーがログインしている場合、ユーザー情報を返す
    res.json(req.user);
  } else {
    // ログインしていない場合、空のオブジェクトを返す
    res.json({});
  }
});

export default router;
