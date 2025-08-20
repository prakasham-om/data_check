import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  OTP_PROVIDER: process.env.OTP_PROVIDER || 'console',
  GRIDFS_BUCKET: process.env.GRIDFS_BUCKET || 'uploads',
  MAX_FILE_MB: Number(process.env.MAX_FILE_MB || 20)
};