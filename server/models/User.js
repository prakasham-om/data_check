import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  device: String,
  ua: String,
  ip: String,
  refreshToken: String,
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  passwordHash: String,
  name: String,
  avatarUrl: String,
  sessions: [SessionSchema]
}, { timestamps: true });

export default mongoose.model('User', UserSchema);