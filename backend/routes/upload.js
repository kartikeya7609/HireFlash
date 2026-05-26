import express from 'express';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import upload from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

// Guarantee dotenv loads before reading environment variables
dotenv.config();

const router = express.Router();

// Configure Cloudinary if credentials are provided in env
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
}

// @desc    Upload a file (image or document)
// @route   POST /api/upload
// @access  Private (Authenticated users)
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file type is not supported.'
      });
    }

    const fileType = req.file.mimetype;
    const isImage = fileType.startsWith('image/');

    // 1. If Cloudinary is configured, use it for uploading
    if (isCloudinaryConfigured) {
      // Set cloudinary upload options
      const options = {
        folder: 'fasthire',
        resource_type: isImage ? 'image' : 'raw', // 'raw' is for non-image assets like PDFs
        public_id: `${path.parse(req.file.originalname).name.replace(/\s+/g, '_')}_${Date.now()}`
      };

      // Create upload stream
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
          Readable.from(req.file.buffer).pipe(stream);
        });
      };

      const result = await uploadStream();
      
      return res.status(200).json({
        success: true,
        message: 'File successfully uploaded to Cloudinary.',
        url: result.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        publicId: result.public_id
      });
    } 
    
    // 2. Fallback to Local Disk Storage if Cloudinary credentials are not set
    else {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      // Ensure the local uploads directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${path.parse(req.file.originalname).name.replace(/\s+/g, '_')}_${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // Save buffer to local file system
      fs.writeFileSync(filePath, req.file.buffer);

      // Generate local server URL
      const host = req.get('host');
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${fileName}`;

      return res.status(200).json({
        success: true,
        message: 'File successfully uploaded to local storage.',
        url: fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        localPath: `/uploads/${fileName}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload file.',
      error: error.message
    });
  }
});

export default router;
