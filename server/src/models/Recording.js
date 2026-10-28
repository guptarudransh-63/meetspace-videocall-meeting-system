import mongoose, { Schema } from "mongoose";
const RecordingSchema = new Schema(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, index: true },
    egressId: { type: String, default: null },
    status: {
      type: String,
      enum: ["starting", "active", "stopped", "ready", "failed"],
      default: "starting",
      index: true
    },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    downloadUrl: { type: String },
    sizeBytes: { type: Number, default: 0 },
    initiatorId: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  {
    timestamps: true
  }
);
const Recording = mongoose.model("Recording", RecordingSchema);
export {
  Recording
};
