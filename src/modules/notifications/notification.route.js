import express from 'express';
import { notificationController } from './notification.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/notifications', authMiddleware, notificationController.getNotifications);
router.post('/notifications/mark-as-read', authMiddleware, notificationController.markAsRead);

export const notificationRoute = router;