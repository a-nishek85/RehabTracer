import { Router } from 'express';
import {
    getProgressChartData,
    getProgressHistory,
    getWeeklySummary,
    logProgress,
    updateProgress,
} from '../controllers/progress.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';
import { uploadReport } from '../middleware/upload.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/',                      checkRole('patient'), uploadReport.array('attachments', 5), logProgress);
router.get('/:patientId',             getProgressHistory);
router.get('/:patientId/chart',       getProgressChartData);
router.get('/:patientId/weekly',      getWeeklySummary);
router.put('/:progressId',            checkRole('patient'), updateProgress);

export default router;