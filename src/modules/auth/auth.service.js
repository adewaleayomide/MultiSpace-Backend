import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../../configs/database.config.js';
import { jwtConfig } from '../../configs/jwt.config.js';
import { env } from '../../configs/env.config.js';

const prisma = getPrismaClient();

export const loginService = {
  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @returns {Object} - User data and tokens
   */
  async authenticateUser(email, password, ipAddress) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        passwordHash: true,
        isActive: true,
        isSuspended: true,
        emailVerified: true,
        failedLoginAttempt: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
      },
    });

    // User not found
    if (!user) {
      throw {
        status: 401,
        message: 'Invalid email or password',
      };
    }

    // Check if user is suspended
    if (user.isSuspended) {
      throw {
        status: 403,
        message: 'Account is suspended. Please contact support.',
      };
    }

    // Check if user is active
    if (!user.isActive) {
      throw {
        status: 403,
        message: 'Account is inactive. Please contact support.',
      };
    }

    // Check if account is locked due to failed login attempts
    const isLocked = await this.isAccountLocked(user.id);
    if (isLocked) {
      throw {
        status: 429,
        message: 'Account temporarily locked due to multiple failed login attempts. Try again after 15 minutes.',
      };
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempt: user.failedLoginAttempt + 1,
        },
      });

      throw {
        status: 401,
        message: 'Invalid email or password',
      };
    }

    // Reset failed login attempts on successful authentication
    if (user.failedLoginAttempt > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempt: 0,
        },
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress,
        userAgent: '', // Should be passed from middleware
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Log audit action
    await this.logAuditEvent(
      user.id,
      'LOGIN_SUCCESS',
      'User logged in successfully',
      ipAddress,
      'INFO'
    );

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: parseInt(jwtConfig.accessExpiry),
        },
      },
    };
  },

  /**
   * Check if account is locked due to failed login attempts
   * @param {string} userId - User ID
   * @returns {boolean} - True if account is locked
   */
  async isAccountLocked(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        failedLoginAttempt: true,
        lastLoginAt: true,
      },
    });

    if (!user || user.failedLoginAttempt < env.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    // Check if lockout duration has passed
    if (user.lastLoginAt) {
      const timeSinceLastLogin = Date.now() - user.lastLoginAt.getTime();
      if (timeSinceLastLogin > env.LOCKOUT_DURATION) {
        return false;
      }
    }

    return true;
  },

  /**
   * Generate JWT tokens
   * @param {string} userId - User ID
   * @param {string} email - User email
   * @returns {Object} - Access and refresh tokens
   */
  generateTokens(userId, email) {
    const accessToken = jwt.sign(
      { userId, email, type: 'access' },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, email, type: 'refresh' },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiry }
    );

    return { accessToken, refreshToken };
  },

  /**
   * Log audit event
   * @param {string} userId - User ID
   * @param {string} action - Action type
   * @param {string} description - Action description
   * @param {string} ipAddress - IP address
   * @param {string} severity - Severity level
   */
  async logAuditEvent(userId, action, description, ipAddress, severity = 'INFO') {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action,
          description,
          ipAddress,
          severity,
        },
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  },

  /**
   * Register a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} username - User username
   * @param {string} displayName - User display name
   * @returns {Object} - Created user data
   */
  async registerUser(email, password, username, displayName) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { status: 400, message: 'Email is already in use' };
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
      },
    });

    return newUser;
  },

  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   */
  async invalidateAllSessions(userId) {
    // Delete all refresh tokens associated with the user
    await prisma.session.deleteMany({
      where: { userId },
    });
  },

  /**
   * Invalidate a specific session for a user
   * @param {string} refreshToken - The refresh token of the session to invalidate
   */
  async invalidateSession(refreshToken) {
    // Delete the session associated with the provided refresh token
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  },

  /**
   * Refresh tokens by validating the refresh token and generating new tokens
   * @param {string} refreshToken - The refresh token to validate
   * @returns {Object} - New access and refresh tokens
   */
  async refreshTokens(refreshToken) {
    // Verify the refresh token
    const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    // Check if the token is blacklisted or invalid
    const existingSession = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!existingSession) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: payload.userId },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const newRefreshToken = jwt.sign(
      { userId: payload.userId },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );

    // Update the session with the new refresh token
    await prisma.session.update({
      where: { id: existingSession.id },
      data: { token: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Authenticate or register user via Google OAuth
   * @param {string} email - User email
   * @param {string} name - User full name
   * @returns {Object} - Authenticated user
   */
  async googleAuthenticate(email, name) {
    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Register new user
      user = await prisma.user.create({
        data: {
          email,
          displayName: name,
          isActive: true,
          emailVerified: true, // Google verifies email
        },
      });
    }

    return user;
  },
};