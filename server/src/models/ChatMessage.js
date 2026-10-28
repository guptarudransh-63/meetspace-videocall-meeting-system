import mongoose, { Schema } from "mongoose";
const ChatMessageSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    senderName: { type: String, required: true, trim: true },
    senderRole: { type: String, default: "participant" },
    message: { type: String, required: true, trim: true },
    messageType: { type: String, enum: ["chat", "system"], default: "chat" }
  },
  {
    timestamps: true
  }
);
ChatMessageSchema.index({ meetingId: 1, createdAt: 1 });
const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
export {
  ChatMessage
};
