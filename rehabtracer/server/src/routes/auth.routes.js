import { Router } from 'express';
import {
    forgotPassword,
    getMe,
    login, logout, refreshAccessToken,
    register,
    resetPassword,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register',        register);
router.post('/login',           login);
router.post('/logout',          verifyToken, logout);
router.post('/refresh',         refreshAccessToken);
router.get('/me',               verifyToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;