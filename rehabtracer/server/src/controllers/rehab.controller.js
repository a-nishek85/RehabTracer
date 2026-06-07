import Doctor from '../models/Doctor.model.js';
import Exercise from '../models/Exercise.model.js';
import Notification from '../models/Notification.model.js';
import Patient from '../models/Patient.model.js';
import RehabPlan from '../models/RehabPlan.model.js';
import { emitNotification } from '../services/socket.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /rehab/plans
export const createPlan = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const { patientId, title, description, startDate, endDate, goals, prescription } = req.body;
  if (!patientId || !title || !startDate) throw new ApiError(400, 'Patient, title, and start date required');

  const patient = await Patient.findById(patientId).populate('user', '_id name');
  if (!patient) throw new ApiError(404, 'Patient not found');
  if (String(patient.connectedDoctor) !== String(doctor._id)) {
    throw new ApiError(403, 'You are not connected to this patient');
  }

  const plan = await RehabPlan.create({
    patient: patientId,
    doctor: doctor._id,
    title, description, startDate, endDate, goals, prescription,
  });

  const notification = await Notification.create({
    recipient: patient.user._id,
    sender:    req.user._id,
    type:      'plan_created',
    title:     'New Rehabilitation Plan',
    body:      `Dr. ${req.user.name} created a new plan: "${title}"`,
    link:      '/patient/exercises',
    meta:      { planId: plan._id },
  });
  emitNotification(patient.user._id.toString(), notification);

  return res.status(201).json(new ApiResponse(201, { plan }, 'Rehab plan created'));
});

// GET /rehab/plans/:patientId
export const getPatientPlans = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { status } = req.query;

  const filter = { patient: patientId };
  if (status) filter.status = status;

  const plans = await RehabPlan.find(filter)
    .populate('exercises')
    .populate('doctor', 'specialization hospital')
    .sort({ createdAt: -1 });

  return res.json(new ApiResponse(200, { plans }, 'Plans fetched'));
});

// GET /rehab/plans/detail/:planId
export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId)
    .populate('exercises')
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name email profileImage' } })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email profileImage' } });

  if (!plan) throw new ApiError(404, 'Plan not found');
  return res.json(new ApiResponse(200, { plan }, 'Plan fetched'));
});

// PUT /rehab/plans/:planId
export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (String(plan.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');

  const allowed = ['title', 'description', 'endDate', 'status', 'goals', 'prescription', 'targetRecoveryPct'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) plan[f] = req.body[f]; });
  await plan.save();

  return res.json(new ApiResponse(200, { plan }, 'Plan updated'));
});

// DELETE /rehab/plans/:planId
export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (String(plan.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');

  await Exercise.deleteMany({ rehabPlan: plan._id });
  await plan.deleteOne();

  return res.json(new ApiResponse(200, {}, 'Plan deleted'));
});

// POST /rehab/plans/:planId/exercises
export const addExercise = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (String(plan.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');

  const exercise = await Exercise.create({
    ...req.body,
    rehabPlan: plan._id,
    patient:   plan.patient,
  });

  plan.exercises.push(exercise._id);
  await plan.save();

  return res.status(201).json(new ApiResponse(201, { exercise }, 'Exercise added'));
});

// DELETE /rehab/plans/:planId/exercises/:exId
export const removeExercise = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (String(plan.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');

  await Exercise.findByIdAndDelete(req.params.exId);
  plan.exercises.pull(req.params.exId);
  await plan.save();

  return res.json(new ApiResponse(200, {}, 'Exercise removed'));
});

// PATCH /rehab/exercises/:exId/complete
export const markExerciseComplete = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.exId);
  if (!exercise) throw new ApiError(404, 'Exercise not found');

  const patient = await Patient.findOne({ user: req.user._id });
  if (String(exercise.patient) !== String(patient._id)) throw new ApiError(403, 'Not authorized');

  exercise.isCompleted = true;
  exercise.completedAt = new Date();
  exercise.completionLog.push({
    completedAt: new Date(),
    notes:       req.body.notes || '',
    painLevel:   req.body.painLevel || 0,
  });
  await exercise.save();

  // Update plan recovery percentage
  const allExercises = await Exercise.find({ rehabPlan: exercise.rehabPlan, isActive: true });
  const completed = allExercises.filter((e) => e.isCompleted).length;
  const pct = Math.round((completed / allExercises.length) * 100);
  await RehabPlan.findByIdAndUpdate(exercise.rehabPlan, { currentRecoveryPct: pct });

  return res.json(new ApiResponse(200, { exercise }, 'Exercise marked complete'));
});

// POST /rehab/plans/:planId/notes
export const addRecoveryNote = asyncHandler(async (req, res) => {
  const plan = await RehabPlan.findById(req.params.planId);
  if (!plan) throw new ApiError(404, 'Plan not found');

  plan.recoveryNotes.push({ note: req.body.note, addedBy: req.user._id });
  await plan.save();

  return res.json(new ApiResponse(200, { plan }, 'Note added'));
});