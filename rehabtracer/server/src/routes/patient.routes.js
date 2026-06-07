import { Router } from 'express';
import { getMyDoctor, getPatientById, getPatientStats } from '../controllers/patient.controller.js';
import { sendRequest } from '../controllers/request.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/stats',             checkRole('patient'), getPatientStats);
router.get('/my-doctor',         checkRole('patient'), getMyDoctor);
router.post('/request/:doctorId',checkRole('patient'), sendRequest);
router.get('/:id',               getPatientById);

export default router;