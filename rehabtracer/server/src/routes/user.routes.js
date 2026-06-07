import { Router } from 'express';
import { changePassword, getProfile, updateProfile } from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadProfileImage } from '../middleware/upload.middleware.js';

const router = Router();
router.use(verifyToken);
router.get('/profile',    getProfile);
router.put('/profile',    uploadProfileImage.single('profileImage'), updateProfile);
router.put('/change-password', changePassword);
export default router;