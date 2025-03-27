import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'dist/public/uploads'));
  },
  filename: (req, file, cb) => {
    // Create unique filename to prevent overwriting
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Create multer middleware
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    // Can be restricted by checking file.mimetype if needed
    cb(null, true);
  }
});
