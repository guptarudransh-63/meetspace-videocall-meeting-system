import mongoose, { Schema } from "mongoose";
const InvitationSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "revoked"],
      default: "pending",
      index: true
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true }
  },
  {
    timestamps: true
  }
);
InvitationSchema.index({ meetingId: 1, inviteeEmail: 1 }, { unique: true });
const Invitation = mongoose.model("Invitation", InvitationSchema);
export {
  Invitation
};
