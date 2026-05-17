import { body } from 'express-validator';

export const updateUserValidator = [
  body('email').optional().isEmail().withMessage('Invalid email address.'),
  body('currentPassword').optional().isString().withMessage('Current password must be a string.'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long.'),
  body('confirmNewPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Confirm password must match new password.');
      }
      return true;
    }),
  body('displayName')
    .optional()
    .isString()
    .withMessage('Display name must be a string.'),
];

export const validateSingleFieldUpdate = [
  body('email').optional().isEmail().withMessage('Invalid email address.'),
  body('currentPassword').optional().isString().withMessage('Current password must be a string.'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long.'),
  body('displayName')
    .optional()
    .isString()
    .withMessage('Display name must be a string.'),
];