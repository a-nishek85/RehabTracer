import { Router } from 'express';
import {
    getDoctorById,
    getDoctorStats, getMyPatients,
    getPatientProgress,
    searchByDoctorId,
} from '../controllers/doctor.controller.js';
import {
    acceptRequest,
    getDoctorRequests,
    rejectRequest,
} from '../controllers/request.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/search',                         searchByDoctorId);
router.get('/stats',          checkRole('doctor'), getDoctorStats);
router.get('/patients',       checkRole('doctor'), getMyPatients);
router.get('/requests',       checkRole('doctor'), getDoctorRequests);
router.patch('/requests/:id/accept', checkRole('doctor'), acceptRequest);
router.patch('/requests/:id/reject', checkRole('doctor'), rejectRequest);
router.get('/patient/:patientId/progress', checkRole('doctor'), getPatientProgress);
router.get('/:id',                         getDoctorById);

export default router;