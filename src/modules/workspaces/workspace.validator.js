

export const createWorkspaceValidator = [
  body('name')
    .notEmpty()
    .withMessage('Workspace name is required.')
    .isString()
    .withMessage('Workspace name must be a string.'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.'),
];