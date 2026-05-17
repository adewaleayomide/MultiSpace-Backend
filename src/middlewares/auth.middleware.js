import jwt from 'jsonwebtoken';
import { jwtConfig } from '../configs/jwt.config.js';
import { UserRole } from '@prisma/client'
/**
 * Middleware to authenticate users using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to enforce role-based access control (RBAC)
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
export const rbacMiddleware = (allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role; // Extract user role from the decoded token

  // Allow SUPER_ADMIN to bypass all role checks
  if (userRole === UserRole.SUPER_ADMIN) {
    return next();
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
  }

  next();
};

