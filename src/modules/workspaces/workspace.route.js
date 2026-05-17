import express from 'express';
import { workspaceController } from './workspace.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { createWorkspaceValidator } from './workspace.validator.js';
import { validateRequest } from '../../middlewares/validateRequest.middleware.js';

const router = express.Router();

// POST /workspaces - Create a new workspace
router.post(
  '/',
  authMiddleware, // Ensure the user is authenticated
  createWorkspaceValidator,
  validateRequest,
  workspaceController.createWorkspace
);

// GET /workspaces - Retrieve all workspaces for the authenticated user
router.get(
  '/',
  authMiddleware, // Ensure the user is authenticated
  workspaceController.getUserWorkspaces
);

// GET /workspaces/:id - Retrieve details of a specific workspace
router.get(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  workspaceController.getWorkspaceById
);

// PUT /workspaces/:id - Update workspace information
router.put(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  createWorkspaceValidator, // Reuse the same validator for updating workspace info
  validateRequest,
  workspaceController.updateWorkspace
);

// DELETE /workspaces/:id - Delete a workspace
router.delete(
  '/:id',
  authMiddleware, // Ensure the user is authenticated
  workspaceController.deleteWorkspace
);

export default router;