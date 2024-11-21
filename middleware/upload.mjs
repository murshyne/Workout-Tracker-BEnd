import express from 'express';
import multer from 'multer';

const router = express.Router(); 

// Set up disk storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Use timestamp + original filename to avoid conflicts
  },
});

// Filter to accept only image files
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

// Create the upload middleware with size and filter configurations
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 },
}).single('profilePicture');

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

router.use(handleUploadError); // 'profilePicture' is the name attribute in your form

export { upload };
