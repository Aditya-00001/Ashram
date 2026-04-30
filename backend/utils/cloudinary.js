import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure with your Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create the storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // SECURITY SANDBOX: Determine the resource type and folder based on the file
    let folder = 'ashram_chat_attachments';
    let resource_type = 'auto'; // Let Cloudinary figure out if it's an image/video/raw
    
    // Strict MIME-type checking
    if (file.mimetype.startsWith('image/')) {
      resource_type = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      resource_type = 'video';
    } else if (file.mimetype === 'application/pdf') {
      resource_type = 'raw'; // Documents must be handled as raw files in Cloudinary
    } else {
      throw new Error('Unsupported file type. Security Sandbox blocked the upload.');
    }

    return {
      folder: folder,
      resource_type: resource_type,
      // Keep the original filename but add a timestamp to prevent overwrites
      public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}` 
    };
  },
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Hard limit: 10MB per file to save your bandwidth!
});