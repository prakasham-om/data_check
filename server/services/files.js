import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { env } from '../config/env.js';

export const storage = new GridFsStorage({
  url: env.MONGO_URI,
  file: (_req, file) => ({ bucketName: env.GRIDFS_BUCKET, filename: Date.now() + '_' + file.originalname })
});

export const uploader = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_MB * 1024 * 1024 }
});