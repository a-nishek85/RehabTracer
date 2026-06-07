import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';
import Notification from '../models/Notification.model.js';
import Patient from '../models/Patient.model.js';
import { emitNotification } from '../services/socket.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /appointments
export const createAppointment = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const { patientId, scheduledAt, duration, type, reason, videoLink } = req.body;
  if (!patientId || !scheduledAt) throw new ApiError(400, 'Patient and date/time are required');

  const patient = await Patient.findById(patientId).populate('user', '_id name');
  if (!patient) throw new ApiError(404, 'Patient not found');

  // Check for scheduling conflicts
  const conflict = await Appointment.findOne({
    doctor:  doctor._id,
    status:  'upcoming',
    scheduledAt: {
      $gte: new Date(new Date(scheduledAt).getTime() - (duration || 30) * 60000),
      $lte: new Date(new Date(scheduledAt).getTime() + (duration || 30) * 60000),
    },
  });
  if (conflict) throw new ApiError(409, 'Time slot conflicts with an existing appointment');

  const appointment = await Appointment.create({
    patient: patientId,
    doctor:  doctor._id,
    scheduledAt, duration, type, reason, videoLink,
  });

  const notification = await Notification.create({
    recipient: patient.user._id,
    sender:    req.user._id,
    type:      'appointment_scheduled',
    title:     'Appointment Scheduled',
    body:      `Dr. ${req.user.name} scheduled an appointment on ${new Date(scheduledAt).toLocaleDateString()}`,
    link:      '/patient/appointments',
    meta:      { appointmentId: appointment._id },
  });
  emitNotification(patient.user._id.toString(), notification);

  return res.status(201).json(new ApiResponse(201, { appointment }, 'Appointment created'));
});

// GET /appointments
export const getAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let filter = {};
  if (req.user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: req.user._id });
    filter.doctor = doctor._id;
  } else if (req.user.role === 'patient') {
    const patient = await Patient.findOne({ user: req.user._id });
    filter.patient = patient._id;
  }
  if (status) filter.status = status;

  const appointments = await Appointment.find(filter)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email profileImage' } })
    .populate({ path: 'doctor',  populate: { path: 'user', select: 'name email profileImage' } })
    .sort({ scheduledAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Appointment.countDocuments(filter);

  return res.json(new ApiResponse(200, {
    appointments,
    pagination: { page: Number(page), limit: Number(limit), total },
  }, 'Appointments fetched'));
});

// GET /appointments/:id
export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email profileImage' } })
    .populate({ path: 'doctor',  populate: { path: 'user', select: 'name email profileImage' } });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  return res.json(new ApiResponse(200, { appointment }, 'Appointment fetched'));
});

// PUT /appointments/:id
export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  const allowed = ['scheduledAt', 'duration', 'type', 'notes', 'videoLink', 'reason'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) appointment[f] = req.body[f]; });
  await appointment.save();

  return res.json(new ApiResponse(200, { appointment }, 'Appointment updated'));
});

// PATCH /appointments/:id/cancel
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: '_id' } })
    .populate({ path: 'doctor',  populate: { path: 'user', select: '_id' } });
  if (!appointment) throw new ApiError(404, 'Appointment not found');
  if (appointment.status !== 'upcoming') throw new ApiError(400, 'Appointment cannot be cancelled');

  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.reason || '';
  appointment.cancelledBy = req.user._id;
  await appointment.save();

  // Notify the other party
  const recipientId = req.user.role === 'doctor'
    ? appointment.patient.user._id.toString()
    : appointment.doctor.user._id.toString();

  const notification = await Notification.create({
    recipient: recipientId,
    sender:    req.user._id,
    type:      'appointment_cancelled',
    title:     'Appointment Cancelled',
    body:      `Your appointment has been cancelled. Reason: ${req.body.reason || 'Not specified'}`,
    link:      req.user.role === 'doctor' ? '/patient/appointments' : '/doctor/schedule',
  });
  emitNotification(recipientId, notification);

  return res.json(new ApiResponse(200, { appointment }, 'Appointment cancelled'));
});

// PATCH /appointments/:id/complete
export const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  appointment.status = 'completed';
  appointment.completedAt = new Date();
  appointment.notes = req.body.notes || appointment.notes;
  await appointment.save();

  return res.json(new ApiResponse(200, { appointment }, 'Appointment marked complete'));
});