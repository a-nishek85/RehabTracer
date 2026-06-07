import { Router } from 'express';
import {
    cancelAppointment, completeAppointment,
    createAppointment,
    getAppointmentById,
    getAppointments,
    updateAppointment,
} from '../controllers/appointment.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/',              checkRole('doctor'), createAppointment);
router.get('/',               getAppointments);
router.get('/:id',            getAppointmentById);
router.put('/:id',            checkRole('doctor'), updateAppointment);
router.patch('/:id/cancel',   cancelAppointment);
router.patch('/:id/complete', checkRole('doctor'), completeAppointment);

export default router;