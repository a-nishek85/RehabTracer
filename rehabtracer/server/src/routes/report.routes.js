import { Router } from 'express';
import { generateReport, uploadReport } from '../controllers/report.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';
import { uploadReport as uploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/upload',          uploadMiddleware.single('file'), uploadReport);
router.get('/pdf/:patientId',   checkRole('doctor', 'admin'),    generateReport);

export default router;