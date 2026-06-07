import Patient from '../models/Patient.model.js';
import Progress from '../models/Progress.model.js';
import RehabPlan from '../models/RehabPlan.model.js';
import { generatePDFReport } from '../services/pdf.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /reports/upload
export const uploadReport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  return res.json(new ApiResponse(200, {
    url:  req.file.path,
    name: req.file.originalname,
    type: req.file.mimetype,
  }, 'File uploaded successfully'));
});

// GET /reports/pdf/:patientId
export const generateReport = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId)
    .populate('user', 'name email profileImage')
    .populate({ path: 'connectedDoctor', populate: { path: 'user', select: 'name' } });
  if (!patient) throw new ApiError(404, 'Patient not found');

  const plans     = await RehabPlan.findOne({ patient: patient._id, status: 'active' }).populate('exercises');
  const progress  = await Progress.find({ patient: patient._id }).sort({ date: -1 }).limit(30);

  const pdfBuffer = await generatePDFReport({ patient, plans, progress });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report_${patient._id}.pdf`);
  res.send(pdfBuffer);
});