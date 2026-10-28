import mongoose, { Schema } from "mongoose";
const MeetingSchema = new Schema(
  {
    meetingCode: { type: String, required: true, unique: true, uppercase: false, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    hostId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledStartTime: { type: Date },
    scheduledDuration: { type: Number, default: 30 },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    status: {
      type: String,
      enum: ["scheduled", "active", "ended", "cancelled"],
      default: "scheduled",
      index: true
    },
    passcode: { type: String, default: null },
    isWaitingRoomEnabled: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 100 },
    isLocked: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    allowParticipantUnmute: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);
MeetingSchema.index({ hostId: 1, createdAt: -1 });
MeetingSchema.index({ scheduledStartTime: 1, status: 1 });
const Meeting = mongoose.model("Meeting", MeetingSchema);
export {
  Meeting
};
