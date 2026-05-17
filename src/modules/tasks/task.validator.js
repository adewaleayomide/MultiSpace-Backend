
export const taskValidator = [
  body('title')
    .notEmpty()
    .withMessage('Task title is required.')
    .isString()
    .withMessage('Task title must be a string.'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string.'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Status must be one of: pending, in-progress, completed.'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date.'),
];