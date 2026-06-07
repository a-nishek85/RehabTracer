import Appointment from '../models/Appointment.model.js';
import Exercise from '../models/Exercise.model.js';
import Patient from '../models/Patient.model.js';
import RehabPlan from '../models/RehabPlan.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /patients/stats
export const getPatientStats = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const [activePlan, upcomingAppointments, totalExercises, completedExercises] = await Promise.all([
    RehabPlan.findOne({ patient: patient._id, status: 'active' }),
    Appointment.countDocuments({ patient: patient._id, status: 'upcoming', scheduledAt: { $gte: new Date() } }),
    Exercise.countDocuments({ patient: patient._id, isActive: true }),
    Exercise.countDocuments({ patient: patient._id, isCompleted: true }),
  ]);

  const recoveryPct = activePlan?.currentRecoveryPct || 0;
  const exerciseCompletionPct = totalExercises > 0
    ? Math.round((completedExercises / totalExercises) * 100)
    : 0;

  return res.json(new ApiResponse(200, {
    recoveryPct,
    upcomingAppointments,
    totalExercises,
    completedExercises,
    exerciseCompletionPct,
    hasActiveplan: !!activePlan,
    connectedDoctor: patient.connectedDoctor,
    connectionStatus: patient.connectionStatus,
  }, 'Stats fetched'));
});

// GET /patients/my-doctor
export const getMyDoctor = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id })
    .populate({
      path: 'connectedDoctor',
      populate: { path: 'user', select: 'name email profileImage' },
    });
  if (!patient) throw new ApiError(404, 'Patient not found');
  if (!patient.connectedDoctor) {
    return res.json(new ApiResponse(200, { doctor: null }, 'No connected doctor'));
  }
  return res.json(new ApiResponse(200, { doctor: patient.connectedDoctor }, 'Doctor fetched'));
});

// GET /patients/:id
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate('user', 'name email profileImage')
    .populate({ path: 'connectedDoctor', populate: { path: 'user', select: 'name email profileImage' } });
  if (!patient) throw new ApiError(404, 'Patient not found');
  return res.json(new ApiResponse(200, { patient }, 'Patient fetched'));
});