import Patient from '../models/Patient.model.js';
import Progress from '../models/Progress.model.js';
import RehabPlan from '../models/RehabPlan.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /progress
export const logProgress = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient not found');

  const { rehabPlanId, painLevel, mobilityScore, exercisesCompleted, totalExercises, mood, notes, vitals } = req.body;
  if (!rehabPlanId || painLevel === undefined) throw new ApiError(400, 'Plan ID and pain level required');

  const plan = await RehabPlan.findById(rehabPlanId);
  if (!plan) throw new ApiError(404, 'Rehab plan not found');

  const recoveryPct = totalExercises > 0
    ? Math.round((exercisesCompleted / totalExercises) * 100)
    : 0;

  const progress = await Progress.create({
    patient:    patient._id,
    rehabPlan:  rehabPlanId,
    loggedBy:   req.user._id,
    painLevel, mobilityScore, exercisesCompleted, totalExercises, recoveryPct, mood, notes, vitals,
    attachments: req.files?.map((f) => ({ url: f.path, name: f.originalname })) || [],
  });

  // Update plan current recovery
  await RehabPlan.findByIdAndUpdate(rehabPlanId, { currentRecoveryPct: recoveryPct });

  return res.status(201).json(new ApiResponse(201, { progress }, 'Progress logged'));
});

// GET /progress/:patientId
export const getProgressHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const progress = await Progress.find({ patient: req.params.patientId })
    .sort({ date: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate('rehabPlan', 'title');

  const total = await Progress.countDocuments({ patient: req.params.patientId });

  return res.json(new ApiResponse(200, {
    progress,
    pagination: { page: Number(page), limit: Number(limit), total },
  }, 'Progress history fetched'));
});

// GET /progress/:patientId/chart
export const getProgressChartData = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const from = new Date();
  from.setDate(from.getDate() - Number(days));

  const progress = await Progress.find({
    patient: req.params.patientId,
    date:    { $gte: from },
  }).sort({ date: 1 }).select('date painLevel recoveryPct mobilityScore mood exercisesCompleted totalExercises');

  return res.json(new ApiResponse(200, { progress }, 'Chart data fetched'));
});

// GET /progress/:patientId/weekly
export const getWeeklySummary = asyncHandler(async (req, res) => {
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const data = await Progress.aggregate([
    { $match: { patient: require('mongoose').Types.ObjectId(req.params.patientId), date: { $gte: from } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
      avgPain:      { $avg: '$painLevel' },
      avgRecovery:  { $avg: '$recoveryPct' },
      totalEx:      { $sum: '$exercisesCompleted' },
    }},
    { $sort: { _id: 1 } },
  ]);

  return res.json(new ApiResponse(200, { weekly: data }, 'Weekly summary fetched'));
});

// PUT /progress/:progressId
export const updateProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.findById(req.params.progressId);
  if (!progress) throw new ApiError(404, 'Progress entry not found');

  const patient = await Patient.findOne({ user: req.user._id });
  if (String(progress.patient) !== String(patient._id)) throw new ApiError(403, 'Not authorized');

  const allowed = ['painLevel', 'mobilityScore', 'mood', 'notes', 'vitals'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) progress[f] = req.body[f]; });
  await progress.save();

  return res.json(new ApiResponse(200, { progress }, 'Progress updated'));
});