import mongoose from 'mongoose';

const ReactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emoji: String
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  fileId: String,          // GridFS id
  fileName: String,
  fileType: String,
  imageThumbUrl: String,
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [ReactionSchema]
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);