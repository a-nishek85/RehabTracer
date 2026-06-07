import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import Progress from '../models/Progress.model.js';
import RehabPlan from '../models/RehabPlan.model.js';
import Request from '../models/Request.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /doctors/search?doctorId=
export const searchByDoctorId = asyncHandler(async (req, res) => {
  const { doctorId } = req.query;
  if (!doctorId) throw new ApiError(400, 'Doctor ID is required');

  const doctor = await Doctor.findOne({ doctorId: doctorId.toUpperCase(), isApproved: true })
    .populate('user', 'name email profileImage');

  if (!doctor) throw new ApiError(404, 'Doctor not found or not approved');
  return res.json(new ApiResponse(200, { doctor }, 'Doctor found'));
});

// GET /doctors/stats
export const getDoctorStats = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const [totalPatients, activePlans, pendingRequests, upcomingAppointments] = await Promise.all([
    Patient.countDocuments({ connectedDoctor: doctor._id }),
    RehabPlan.countDocuments({ doctor: doctor._id, status: 'active' }),
    Request.countDocuments({ doctor: doctor._id, status: 'pending' }),
    Appointment.countDocuments({ doctor: doctor._id, status: 'upcoming', scheduledAt: { $gte: new Date() } }),
  ]);

  return res.json(new ApiResponse(200, {
    totalPatients, activePlans, pendingRequests, upcomingAppointments,
  }, 'Stats fetched'));
});

// GET /doctors/patients
export const getMyPatients = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor profile not found');

  const { page = 1, limit = 10, search = '' } = req.query;
  const skip = (page - 1) * limit;

  const patientIds = doctor.patients;
  let query = { _id: { $in: patientIds } };

  const patients = await Patient.find(query)
    .populate({
      path: 'user',
      select: 'name email profileImage',
      match: search ? { name: { $regex: search, $options: 'i' } } : {},
    })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const filtered = patients.filter((p) => p.user !== null);
  const total = filtered.length;

  return res.json(new ApiResponse(200, {
    patients: filtered,
    pagination: { page: Number(page), limit: Number(limit), total },
  }, 'Patients fetched'));
});

// GET /doctors/:id
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email profileImage');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  return res.json(new ApiResponse(200, { doctor }, 'Doctor fetched'));
});

// GET /doctors/patient/:patientId/progress
export const getPatientProgress = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const patient = await Patient.findById(req.params.patientId);
  if (!patient || String(patient.connectedDoctor) !== String(doctor._id)) {
    throw new ApiError(403, 'Not authorized to view this patient');
  }

  const progress = await Progress.find({ patient: patient._id })
    .sort({ date: -1 })
    .limit(30)
    .populate('rehabPlan', 'title');

  return res.json(new ApiResponse(200, { progress }, 'Progress fetched'));
});