import { OAuth2Client } from 'google-auth-library';
import { loginService } from './auth.service.js';
import { env } from '../../configs/env.config.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const authController = {
  /**
   * Login endpoint
   * POST /auth/login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Get client IP address
      const ipAddress =
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket.remoteAddress;

      // Get user agent
      const userAgent = req.headers['user-agent'] || '';

      // Authenticate user
      const result = await loginService.authenticateUser(
        email,
        password,
        ipAddress
      );

      // Set secure, httpOnly cookie for refresh token (optional)
      res.cookie('refreshToken', result.data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Login error:', error);

      // Handle different error types
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  /**
   * Logout endpoint
   * POST /auth/logout
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Invalidate the current session
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      await loginService.invalidateSession(refreshToken);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },

  /**
   * Register endpoint
   * POST /auth/register
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { email, password, username, displayName } = req.body;

      // Call the service to register the user
      const result = await loginService.registerUser(
        email,
        password,
        username,
        displayName
      );

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  },

  /**
   * Refresh Token endpoint
   * POST /auth/refresh-token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Verify and rotate the refresh token
      const tokens = await loginService.refreshTokens(refreshToken);

      // Set the new refresh token as a secure, httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  },

  /**
   * Redirect to Google OAuth
   */
  async googleLogin(req, res) {
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    res.redirect(redirectUrl);
  },

  /**
   * Handle Google OAuth callback
   */
  async googleCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code is required',
        });
      }

      // Exchange code for tokens
      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
      });

      // Verify ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name } = payload;

      // Authenticate or register user
      const user = await loginService.googleAuthenticate(email, name);

      // Generate app tokens
      const appTokens = await loginService.generateTokens(user.id);

      // Set refresh token as a secure cookie
      res.cookie('refreshToken', appTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: appTokens,
      });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
};
