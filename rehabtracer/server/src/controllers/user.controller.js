import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import User from '../models/User.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  let profile = null;
  if (req.user.role === 'doctor') {
    profile = await Doctor.findOne({ user: req.user._id });
  } else if (req.user.role === 'patient') {
    profile = await Patient.findOne({ user: req.user._id }).populate({
      path: 'connectedDoctor',
      populate: { path: 'user', select: 'name email profileImage' },
    });
  }
  return res.json(new ApiResponse(200, { user, profile }, 'Profile fetched'));
});

// PUT /users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, ...rest } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (req.file?.path) updates.profileImage = req.file.path;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });

  if (req.user.role === 'doctor') {
    const allowed = ['specialization', 'hospital', 'experience', 'bio', 'qualifications', 'consultationFee', 'availability'];
    const doctorUpdates = {};
    allowed.forEach((f) => { if (rest[f] !== undefined) doctorUpdates[f] = rest[f]; });
    await Doctor.findOneAndUpdate({ user: req.user._id }, doctorUpdates, { new: true });
  }

  if (req.user.role === 'patient') {
    const allowed = ['age', 'gender', 'medicalCondition', 'contactNumber', 'bloodGroup', 'emergencyContact', 'address', 'allergies', 'medications'];
    const patientUpdates = {};
    allowed.forEach((f) => { if (rest[f] !== undefined) patientUpdates[f] = rest[f]; });
    await Patient.findOneAndUpdate({ user: req.user._id }, patientUpdates, { new: true });
  }

  return res.json(new ApiResponse(200, { user }, 'Profile updated'));
});

// PUT /users/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Both passwords required');

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();

  return res.json(new ApiResponse(200, {}, 'Password changed successfully'));
});