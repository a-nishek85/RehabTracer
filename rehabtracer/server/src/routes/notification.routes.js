import { Router } from 'express';
import {
    deleteNotification,
    getNotifications,
    markAllAsRead,
    markAsRead,
} from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/',              getNotifications);
router.patch('/read-all',    markAllAsRead);
router.patch('/:id/read',    markAsRead);
router.delete('/:id',        deleteNotification);

export default router;