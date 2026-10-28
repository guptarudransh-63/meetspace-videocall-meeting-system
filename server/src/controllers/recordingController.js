import { Meeting } from "../models/Meeting.js";
import { Recording } from "../models/Recording.js";
import { AppError } from "../middleware/errorHandler.js";
const getRecordings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can access meeting recordings", 403);
    }
    const recordings = await Recording.find({ meetingId: meeting._id }).sort({ startedAt: -1 });
    res.status(200).json({
      success: true,
      recordings
    });
  } catch (error) {
    next(error);
  }
};
const startRecording = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can start a recording", 403);
    }
    const active = await Recording.findOne({ meetingId: meeting._id, status: { $in: ["starting", "active"] } });
    if (active) {
      throw new AppError("A recording session is already running", 400);
    }
    const recording = await Recording.create({
      meetingId: meeting._id,
      status: "active",
      startedAt: /* @__PURE__ */ new Date(),
      initiatorId: req.user.id
    });
    res.status(201).json({
      success: true,
      message: "Recording started",
      recording
    });
  } catch (error) {
    next(error);
  }
};
const stopRecording = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can stop recording", 403);
    }
    const recording = await Recording.findOne({
      meetingId: meeting._id,
      status: "active"
    }).sort({ startedAt: -1 });
    if (!recording) {
      throw new AppError("No active recording session found for this meeting", 404);
    }
    const endedAt = /* @__PURE__ */ new Date();
    const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - recording.startedAt.getTime()) / 1e3));
    recording.status = "ready";
    recording.endedAt = endedAt;
    recording.durationSeconds = durationSeconds;
    recording.downloadUrl = `/recordings/${meeting.meetingCode}-${recording._id}.mp4`;
    await recording.save();
    res.status(200).json({
      success: true,
      message: "Recording stopped and metadata saved",
      recording
    });
  } catch (error) {
    next(error);
  }
};
export {
  getRecordings,
  startRecording,
  stopRecording
};
