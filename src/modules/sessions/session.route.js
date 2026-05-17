// login sessions
// device tracking
// logout all devices
// revoke session

import express from 'express';
import { sessionController } from './session.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, sessionController.getUserSessions);
router.post('/logout', authMiddleware, sessionController.logoutCurrentSession);
router.post('/logout-all', authMiddleware, sessionController.logoutAllSessions);

export const sessionRouter = router;