import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const createStorage = (folder, resourceType = 'auto') =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `rehabtracer/${folder}`,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4'],
      transformation: resourceType === 'image' ? [{ width: 800, crop: 'limit' }] : undefined,
    }),
  });

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/jpg', 'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'File type not supported'), false);
  }
};

export const uploadProfileImage = multer({
  storage: createStorage('profiles', 'image'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadReport = multer({
  storage: createStorage('reports', 'auto'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

export const uploadExerciseMedia = multer({
  storage: createStorage('exercises', 'auto'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});