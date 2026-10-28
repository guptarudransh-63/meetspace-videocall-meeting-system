import mongoose, { Schema } from "mongoose";
const MeetingParticipantSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    displayName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["host", "co-host", "participant"],
      default: "participant"
    },
    status: {
      type: String,
      enum: ["waiting", "admitted", "rejected", "left", "removed"],
      default: "admitted"
    },
    admittedAt: { type: Date },
    admittedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  {
    timestamps: true
  }
);
MeetingParticipantSchema.index({ meetingId: 1, userId: 1 });
MeetingParticipantSchema.index({ meetingId: 1, status: 1 });
const MeetingParticipant = mongoose.model("MeetingParticipant", MeetingParticipantSchema);
export {
  MeetingParticipant
};
