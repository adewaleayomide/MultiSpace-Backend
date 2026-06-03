import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../../configs/database.config.js';
import { jwtConfig } from '../../configs/jwt.config.js';
import { env } from '../../configs/env.config.js';
import crypto from 'crypto';
import { sendEmail } from '../../utils/email.util.js';
import { OtpType } from '@prisma/client';


export const loginService = {
  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @returns {Object} - User data and tokens
   */
  async authenticateUser(email, password, ipAddress) {
    const prisma = getPrismaClient();
    
    console.log("Moved past prisma in authenticateUser /auth/login");
    
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
    
    console.log("Moved past user in authenticateUser /auth/login");
    // User not found
    if (!user) {
      throw {
        status: 401,
        message: 'Invalid email or password',
      };
    }
    console.log("Moved past !user in authenticateUser /auth/login");

    // Check if user is suspended
    if (user.isSuspended) {
      throw {
        status: 403,
        message: 'Account is suspended. Please contact support.',
      };
    }
    console.log("Moved past user.isSuspended in authenticateUser /auth/login");

    // Check if user is active
    if (!user.isActive) {
      throw {
        status: 403,
        message: 'Account is inactive. Please contact support.',
      };
    }
    console.log("Moved past user.isActive in authenticateUser /auth/login");

    // Check if account is locked due to failed login attempts
    const isLocked = await this.isAccountLocked(user.id);
    if (isLocked) {
      throw {
        status: 429,
        message: 'Account temporarily locked due to multiple failed login attempts. Try again after 15 minutes.',
      };
    }
    console.log("Moved past isLocked in authenticateUser /auth/login");

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

    console.log("Moved past isPasswordCorrect in authenticateUser /auth/login");
    // Reset failed login attempts on successful authentication
    if (user.failedLoginAttempt > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempt: 0,
        },
      });
    }
    console.log("Moved past failedLoginAttemp in authenticateUser /auth/login");

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user.id);
    console.log("Moved past generateToken in authenticateUser /auth/login");

    // Create session with expiration time
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress,
        userAgent: '', // Should be passed from middleware
        isActive: true,
        expiresAt,
      },
    });
    console.log("Moved past await prisma.session in authenticateUser /auth/login");

    // Update last login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });
    console.log("Moved past await user.update in authenticateUser /auth/login");

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
    const prisma = getPrismaClient();
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
   * @returns {Object} - Access and refresh tokens
   */
  generateTokens(userId) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
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
    const prisma = getPrismaClient();
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
    const prisma = getPrismaClient();
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { status: 400, message: 'Email is already in use' };
    }
    
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      throw { status: 400, message: 'Username is already in use' };
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
    const prisma = getPrismaClient();
    // Mark all sessions as inactive (soft delete for audit trail)
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
  },

  /**
   * Invalidate a specific session for a user
   * @param {string} refreshToken - The refresh token of the session to invalidate
   */
  async invalidateSession(refreshToken) {
    const prisma = getPrismaClient();
    // Mark the session as inactive (soft delete for audit trail)
    await prisma.session.updateMany({
      where: { token: refreshToken, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
  },

  /**
   * Refresh tokens by validating the refresh token and generating new tokens
   * @param {string} refreshToken - The refresh token to validate
   * @returns {Object} - New access and refresh tokens
   */
  async refreshTokens(refreshToken) {
    const prisma = getPrismaClient();
    // Verify the refresh token
    const payload = jwt.verify(refreshToken, jwtConfig.refreshSecret);

    // Check if the token is valid and active
    const existingSession = await prisma.session.findFirst({
      where: { token: refreshToken, isActive: true },
    });

    if (!existingSession) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    // Check if session has expired
    if (new Date() > existingSession.expiresAt) {
      throw { status: 401, message: 'Session has expired' };
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: payload.userId, type: 'access' },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry }
    );

    const newRefreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh' },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiry }
    );

    // Calculate new expiration time
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update the session with the new refresh token
    await prisma.session.update({
      where: { id: existingSession.id },
      data: { token: newRefreshToken, expiresAt: newExpiresAt, lastActiveAt: new Date() },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: parseInt(jwtConfig.accessExpiry),
    };
  },

  /**
   * Authenticate or register user via Google OAuth
   * @param {string} email - User email
   * @param {string} name - User full name
   * @returns {Object} - Authenticated user
   */
  async googleAuthenticate(email, name) {
    const prisma = getPrismaClient();
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

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object} - User data
   */
  async findUserByEmail(email) {
    const prisma = getPrismaClient();
    return await prisma.user.findUnique({ where: { email } });
  },

  /**
   * Generate a password reset token
   * @param {string} userId - User ID
   * @returns {string} - The generated reset token
   */
  async generatePasswordResetToken(userId, email, type, attempts) {
    const prisma = getPrismaClient();
    const randomNumber = crypto.randomInt(100000, 1000000).toString();
    const hashedToken = crypto
      .createHash("sha256")
      .update(randomNumber)
      .digest("hex");
      console.log(randomNumber, hashedToken);
    const tokenExpiry = new Date(Date.now() + 25 * 60 * 1000); // Token valid for 15 minutes

    const no_of_attempt = attempts + 1;
    // Save the hashed token and expiry in the database
    await prisma.otpCode.create({
      data: {
        userId,
        email,
        codeHash: hashedToken,
        type,
        expiresAt: tokenExpiry,
        attempts: no_of_attempt,
      },
    });

    return randomNumber; // Return the plain token to send via email
  },

  /**
   * Verify the password reset token
   * @param {string} token - The reset token
   * @returns {Object} - The user data
   */
async verifyPasswordResetToken(email, token) {
  console.log(token)
  const prisma = getPrismaClient();

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    console.log(token, hashedToken)
    console.log("Searching:", {
        email,
        hashedToken,
        type: OtpType.PASSWORD_RESET,
        now: new Date(),
      });
  const otp = await prisma.otpCode.findFirst({
    where: {
      email,
      codeHash: hashedToken,
      type: OtpType.PASSWORD_RESET,
      expiresAt: { gt: new Date() },
    },
  });
  console.log(otp)

  if (!otp) {
    throw new Error("Invalid or expired token");
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return otp.userId;
},

  /**
   * Update the user's password
   * @param {string} userId - User ID
   * @param {string} newPassword - The new password
   */
  async updatePassword(userId, newPassword) {
    const prisma = getPrismaClient();
    console.log(newPassword)
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password
    console.log(newPassword, hashedPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
       },
    });
  },

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - The reset token
   */
  async sendPasswordResetEmail(email, resetToken) {
    const prisma = getPrismaClient();
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const message = `You requested a password reset. Click the link to reset your password: ${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      text: message,
      // html: `<p>You requested a password reset. Click the link below to reset your password:</p>
      //        <h1>${resetToken}</h1>`,
    });
  },
};