import express from 'express';
import { taskController } from './task.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { createTaskValidator } from './task.validator.js';
import { validateRequest } from '../../middlewares/validateRequest.middleware.js';

const router = express.Router();

// POST /tasks - Create a new task
router.post(
  '/',
  authMiddleware, // Ensure the user is authenticated
  createTaskValidator,
  validateRequest,
  taskController.createTask
);

// GET /tasks - Retrieve all tasks for the authenticated user
router.get(
  '/',
  authMiddleware, // Ensure the user is authenticated
  taskController.getUserTasks
);

// GET /tasks/:id - Retrieve details of a specific task
router.get(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  taskController.getTaskById
);

// PUT /tasks/:id - Update task information
router.put(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  createTaskValidator, // Reuse the same validator for updating task info
  validateRequest,
  taskController.updateTask
);

// DELETE /tasks/:id - Delete a task
router.delete(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  taskController.deleteTask
);

export default router;