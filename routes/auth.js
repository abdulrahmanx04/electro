// routes/auth.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', authenticateToken, getProfile);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail()],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  resetPassword
);

router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be 6+ chars')
], changePassword);

module.exports = router;
