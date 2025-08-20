import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  title: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessageAt: Date
}, { timestamps: true });

export default mongoose.model('Conversation', ConversationSchema);