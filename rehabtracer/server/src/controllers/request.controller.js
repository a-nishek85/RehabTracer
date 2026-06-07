import Doctor from '../models/Doctor.model.js';
import Notification from '../models/Notification.model.js';
import Patient from '../models/Patient.model.js';
import Request from '../models/Request.model.js';
import { emitNotification } from '../services/socket.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /patients/request/:doctorId
export const sendRequest = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  if (patient.connectionStatus === 'connected') {
    throw new ApiError(400, 'You are already connected to a doctor');
  }

  const doctor = await Doctor.findById(req.params.doctorId).populate('user', 'name');
  if (!doctor) throw new ApiError(404, 'Doctor not found');
  if (!doctor.isApproved) throw new ApiError(400, 'Doctor is not approved yet');

  const existingRequest = await Request.findOne({ patient: patient._id, doctor: doctor._id });
  if (existingRequest) throw new ApiError(409, 'Request already sent to this doctor');

  const request = await Request.create({
    patient:  patient._id,
    doctor:   doctor._id,
    message:  req.body.message || '',
    status:   'pending',
  });

  // Add to doctor's pending
  await Doctor.findByIdAndUpdate(doctor._id, { $addToSet: { pendingRequests: request._id } });
  await Patient.findByIdAndUpdate(patient._id, { connectionStatus: 'pending' });

  // Notify doctor
  const notification = await Notification.create({
    recipient: doctor.user._id,
    sender:    req.user._id,
    type:      'request_sent',
    title:     'New Patient Request',
    body:      `${req.user.name} has sent you a rehabilitation request`,
    link:      '/doctor/requests',
    meta:      { requestId: request._id },
  });

  emitNotification(doctor.user._id.toString(), notification);

  return res.status(201).json(new ApiResponse(201, { request }, 'Request sent successfully'));
});

// GET /doctors/requests
export const getDoctorRequests = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const { status = 'pending', page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const requests = await Request.find({ doctor: doctor._id, status })
    .populate({ path: 'patient', populate: { path: 'user', select: 'name email profileImage' } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Request.countDocuments({ doctor: doctor._id, status });

  return res.json(new ApiResponse(200, {
    requests,
    pagination: { page: Number(page), limit: Number(limit), total },
  }, 'Requests fetched'));
});

// PATCH /doctors/requests/:id/accept
export const acceptRequest = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const request = await Request.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: '_id name' } });
  if (!request) throw new ApiError(404, 'Request not found');
  if (String(request.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');
  if (request.status !== 'pending') throw new ApiError(400, 'Request already resolved');

  request.status = 'accepted';
  request.resolvedAt = new Date();
  await request.save();

  // Connect patient to doctor
  await Patient.findByIdAndUpdate(request.patient._id, {
    connectedDoctor: doctor._id,
    connectionStatus: 'connected',
  });
  await Doctor.findByIdAndUpdate(doctor._id, {
    $addToSet: { patients: request.patient._id },
    $pull: { pendingRequests: request._id },
  });

  // Notify patient
  const notification = await Notification.create({
    recipient: request.patient.user._id,
    sender:    req.user._id,
    type:      'request_accepted',
    title:     'Request Accepted',
    body:      `Dr. ${req.user.name} has accepted your rehabilitation request`,
    link:      '/patient/dashboard',
  });
  emitNotification(request.patient.user._id.toString(), notification);

  return res.json(new ApiResponse(200, { request }, 'Request accepted'));
});

// PATCH /doctors/requests/:id/reject
export const rejectRequest = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new ApiError(404, 'Doctor not found');

  const request = await Request.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'user', select: '_id name' } });
  if (!request) throw new ApiError(404, 'Request not found');
  if (String(request.doctor) !== String(doctor._id)) throw new ApiError(403, 'Not authorized');
  if (request.status !== 'pending') throw new ApiError(400, 'Request already resolved');

  request.status = 'rejected';
  request.rejectionReason = req.body.reason || '';
  request.resolvedAt = new Date();
  await request.save();

  await Patient.findByIdAndUpdate(request.patient._id, { connectionStatus: 'none' });
  await Doctor.findByIdAndUpdate(doctor._id, { $pull: { pendingRequests: request._id } });

  const notification = await Notification.create({
    recipient: request.patient.user._id,
    sender:    req.user._id,
    type:      'request_rejected',
    title:     'Request Rejected',
    body:      `Dr. ${req.user.name} has rejected your rehabilitation request`,
    link:      '/patient/dashboard',
  });
  emitNotification(request.patient.user._id.toString(), notification);

  return res.json(new ApiResponse(200, { request }, 'Request rejected'));
});