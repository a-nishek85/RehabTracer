import { Router } from 'express';
import adminRoutes from './admin.routes.js';
import appointmentRoutes from './appointment.routes.js';
import authRoutes from './auth.routes.js';
import doctorRoutes from './doctor.routes.js';
import notificationRoutes from './notification.routes.js';
import patientRoutes from './patient.routes.js';
import progressRoutes from './progress.routes.js';
import rehabRoutes from './rehab.routes.js';
import reportRoutes from './report.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/doctors',       doctorRoutes);
router.use('/patients',      patientRoutes);
router.use('/rehab',         rehabRoutes);
router.use('/progress',      progressRoutes);
router.use('/appointments',  appointmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports',       reportRoutes);
router.use('/admin',         adminRoutes);

export default router;