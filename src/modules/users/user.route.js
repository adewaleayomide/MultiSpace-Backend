import express from 'express';
import { userController } from './user.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validateSingleFieldUpdate } from './user.validator.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';

const router = express.Router();

// PUT /users/update - Update user information
// router.put(
//   '/update',
//   authMiddleware, // Ensure the user is authenticated
//   updateUserValidator,
//   validateRequest,
//   userController.updateUserInfo
// );

// GET /users/profile - Retrieve user profile
router.get(
  '/profile',
  authMiddleware, // Ensure the user is authenticated
  userController.getUserProfile
);

// POST /users/deactivate - Deactivate user account
router.post(
  '/deactivate',
  authMiddleware, // Ensure the user is authenticated
  userController.deactivateAccount
);

// GET /users/lookup - Lookup users based on criteria
router.get(
  '/lookup',
  authMiddleware, // Ensure the user is authenticated
  userController.lookupUsers
);

// PUT /users/update-email - Update user email
router.put(
  '/update-email',
  authMiddleware, // Ensure the user is authenticated
  validateSingleFieldUpdate, // Validate email field
  validateRequest,
  userController.updateUserEmail
);

// PUT /users/update-password - Update user password
router.put(
  '/update-password',
  authMiddleware, // Ensure the user is authenticated
  validateSingleFieldUpdate, // Validate password fields
  validateRequest,
  userController.updateUserPassword
);

// PUT /users/update-display-name - Update user display name
router.put(
  '/update-display-name',
  authMiddleware, // Ensure the user is authenticated
  validateSingleFieldUpdate, // Validate display name field
  validateRequest,
  userController.updateUserDisplayName
);

export default router;