import bcrypt from 'bcrypt';
import { loginService } from '../auth/auth.service.js';

export const userController = {
  /**
   * Update user information (single field updates)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUserInfo(req, res) {
    try {
      const userId = req.user.id; // Assuming `req.user` contains the authenticated user's info
      const { email, currentPassword, newPassword, displayName } = req.body;

      if (email) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Email is already in use.' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        await prisma.user.update({
          where: { id: userId },
          data: { email },
        });

        // Send notification to the old email
        await emailUtil.sendEmail(user.email, 'Email Changed', 'Your email has been updated.');

        return res.status(200).json({ message: 'Email updated successfully.' });
      }

      if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.passwordHash);

        if (!isPasswordCorrect) {
          return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: hashedPassword },
        });

        return res.status(200).json({ message: 'Password updated successfully.' });
      }

      if (displayName) {
        await prisma.user.update({
          where: { id: userId },
          data: { displayName },
        });

        return res.status(200).json({ message: 'Display name updated successfully.' });
      }

      return res.status(400).json({ message: 'No valid fields provided for update.' });
    } catch (error) {
      console.error('Update user info error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Retrieve user profile
   * GET /users/profile
   */
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id; // Extract userId from authenticated user

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          isActive: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Deactivate user account
   * POST /users/deactivate
   */
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.id; // Extract userId from authenticated user

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      return res.status(200).json({ message: 'Account deactivated successfully.' });
    } catch (error) {
      console.error('Error deactivating account:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Lookup users based on criteria
   * GET /users/lookup
   */
  async lookupUsers(req, res) {
    try {
      const { username, email } = req.query;

      const users = await prisma.user.findMany({
        where: {
          OR: [
            username ? { username: { contains: username, mode: 'insensitive' } } : {},
            email ? { email: { contains: email, mode: 'insensitive' } } : {},
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
        },
      });

      return res.status(200).json({ users });
    } catch (error) {
      console.error('Error looking up users:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Update user email
   */
  async updateUserEmail(req, res) {
    try {
      const userId = req.user.id;
      const { email } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });

      // Send notification to the old email
      await emailUtil.sendNotificationEmail(user.email, 'Email Changed', 'Your email has been updated.');

      return res.status(200).json({ message: 'Email updated successfully.' });
    } catch (error) {
      console.error('Update email error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Update user password
   */
  async updateUserPassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.error('Update password error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },

  /**
   * Update user display name
   */
  async updateUserDisplayName(req, res) {
    try {
      const userId = req.user.id;
      const { displayName } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: { displayName },
      });

      return res.status(200).json({ message: 'Display name updated successfully.' });
    } catch (error) {
      console.error('Update display name error:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  },
};