import mongoose, { Schema } from "mongoose";
const AttendanceSessionSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    displayName: { type: String, required: true, trim: true },
    participantIdentity: { type: String, required: true, index: true },
    socketId: { type: String, default: null },
    joinTime: { type: Date, required: true, default: Date.now },
    leaveTime: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    clientInfo: {
      userAgent: { type: String, default: "" },
      platform: { type: String, default: "" },
      ip: { type: String, default: "" }
    },
    disconnectedCleanly: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);
AttendanceSessionSchema.index({ meetingId: 1, participantIdentity: 1, joinTime: -1 });
const AttendanceSession = mongoose.model("AttendanceSession", AttendanceSessionSchema);
export {
  AttendanceSession
};
