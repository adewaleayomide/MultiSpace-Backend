

import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import { loginValidator, validateRequest, registerValidator } from './auth.validator.js';

const router = express.Router();

// Rate limiter for login endpoint (3 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// POST /auth/login - User login
router.post(
  '/login',
  loginLimiter,
  loginValidator,
  validateRequest,
  authController.login
);

// POST /auth/logout - User logout
router.post('/logout', authController.logout);

// POST /auth/register - User registration
router.post(
  '/register',
  registerValidator,
  validateRequest,
  authController.register
);

// POST /auth/refresh-token - Refresh tokens
router.post('/refresh-token', authController.refreshToken);

// GET /auth/google - Redirect to Google OAuth
router.get('/google', authController.googleLogin);

// GET /auth/google/callback - Handle Google OAuth callback
router.get('/google/callback', authController.googleCallback);

// POST /auth/forgot-password - Forgot password
router.post('/forgot-password', authController.forgotPassword);

// POST /auth/reset-password - Reset password
router.post('/reset-password', authController.resetPassword);

export default router;