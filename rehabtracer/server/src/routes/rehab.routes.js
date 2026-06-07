import { Router } from 'express';
import {
    addExercise,
    addRecoveryNote,
    createPlan,
    deletePlan,
    getPatientPlans, getPlanById,
    markExerciseComplete,
    removeExercise,
    updatePlan,
} from '../controllers/rehab.controller.js';
import { checkRole, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.post('/plans',                          checkRole('doctor'),  createPlan);
router.get('/plans/:patientId',                getPatientPlans);
router.get('/plans/detail/:planId',            getPlanById);
router.put('/plans/:planId',                   checkRole('doctor'),  updatePlan);
router.delete('/plans/:planId',                checkRole('doctor'),  deletePlan);
router.post('/plans/:planId/exercises',        checkRole('doctor'),  addExercise);
router.delete('/plans/:planId/exercises/:exId',checkRole('doctor'),  removeExercise);
router.patch('/exercises/:exId/complete',      checkRole('patient'), markExerciseComplete);
router.post('/plans/:planId/notes',            checkRole('doctor'),  addRecoveryNote);

export default router;