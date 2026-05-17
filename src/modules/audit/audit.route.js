// logging actions
// tracking changes
// security logs

// Example:

// user deleted task
// user changed role

import express from 'express';
import { auditController } from './audit.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, auditController.getAuditLogs);

export const auditRouter = router;