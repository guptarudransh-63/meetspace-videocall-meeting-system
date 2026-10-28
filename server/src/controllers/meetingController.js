import { z } from "zod";
import { Meeting } from "../models/Meeting.js";
import { MeetingParticipant } from "../models/MeetingParticipant.js";
import { livekitService } from "../services/livekitService.js";
import { attendanceService } from "../services/attendanceService.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
const generateMeetingCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
};
const createMeetingSchema = z.object({
  title: z.string().min(1, "Meeting title is required").max(120),
  description: z.string().max(500).optional().default(""),
  isInstant: z.boolean().optional().default(false),
  scheduledStartTime: z.string().datetime().optional(),
  scheduledDuration: z.number().min(5).max(1440).optional().default(30),
  passcode: z.string().max(20).optional().or(z.literal("")),
  isWaitingRoomEnabled: z.boolean().optional().default(false),
  maxParticipants: z.number().min(2).max(500).optional().default(100),
  chatEnabled: z.boolean().optional().default(true),
  allowScreenShare: z.boolean().optional().default(true),
  allowParticipantUnmute: z.boolean().optional().default(true)
});
const updateMeetingSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  scheduledStartTime: z.string().datetime().optional(),
  scheduledDuration: z.number().min(5).max(1440).optional(),
  passcode: z.string().max(20).optional().or(z.literal("")),
  isWaitingRoomEnabled: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  chatEnabled: z.boolean().optional(),
  allowScreenShare: z.boolean().optional(),
  allowParticipantUnmute: z.boolean().optional()
});
const joinMeetingSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  passcode: z.string().optional(),
  identity: z.string().optional()
});
const createMeeting = async (req, res, next) => {
  try {
    const {
      title,
      description,
      isInstant,
      scheduledStartTime,
      scheduledDuration,
      passcode,
      isWaitingRoomEnabled,
      maxParticipants,
      chatEnabled,
      allowScreenShare,
      allowParticipantUnmute
    } = req.body;
    let code = generateMeetingCode();
    while (await Meeting.findOne({ meetingCode: code })) {
      code = generateMeetingCode();
    }
    const meeting = await Meeting.create({
      meetingCode: code,
      title,
      description,
      hostId: req.user.id,
      scheduledStartTime: isInstant ? /* @__PURE__ */ new Date() : scheduledStartTime ? new Date(scheduledStartTime) : /* @__PURE__ */ new Date(),
      scheduledDuration: scheduledDuration || 30,
      actualStartTime: isInstant ? /* @__PURE__ */ new Date() : void 0,
      status: isInstant ? "active" : "scheduled",
      passcode: passcode || null,
      isWaitingRoomEnabled: !!isWaitingRoomEnabled,
      maxParticipants: maxParticipants || 100,
      chatEnabled: chatEnabled !== false,
      allowScreenShare: allowScreenShare !== false,
      allowParticipantUnmute: allowParticipantUnmute !== false
    });
    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting,
      joinUrl: `${env.CLIENT_URL}/meeting/${meeting.meetingCode}`
    });
  } catch (error) {
    next(error);
  }
};
const listMeetings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type = "all", page = 1, limit = 20, search = "" } = req.query;
    const query = { hostId: userId };
    if (search) {
      query.title = { $regex: String(search), $options: "i" };
    }
    const now = /* @__PURE__ */ new Date();
    if (type === "upcoming") {
      query.status = { $in: ["scheduled", "active"] };
    } else if (type === "past") {
      query.status = "ended";
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(query).sort({ scheduledStartTime: type === "past" ? -1 : 1, createdAt: -1 }).skip(skip).limit(Number(limit)),
      Meeting.countDocuments(query)
    ]);
    res.status(200).json({
      success: true,
      meetings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
const getMeetingByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const meeting = await Meeting.findOne({ meetingCode: code }).populate("hostId", "name email avatarUrl");
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    const isHost = req.user?.id && String(meeting.hostId._id || meeting.hostId) === req.user.id;
    res.status(200).json({
      success: true,
      meeting: {
        id: meeting._id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        description: meeting.description,
        host: meeting.hostId,
        scheduledStartTime: meeting.scheduledStartTime,
        scheduledDuration: meeting.scheduledDuration,
        status: meeting.status,
        requiresPasscode: !!meeting.passcode,
        isWaitingRoomEnabled: meeting.isWaitingRoomEnabled,
        isLocked: meeting.isLocked,
        chatEnabled: meeting.chatEnabled,
        allowScreenShare: meeting.allowScreenShare,
        allowParticipantUnmute: meeting.allowParticipantUnmute,
        isHost: !!isHost
      }
    });
  } catch (error) {
    next(error);
  }
};
const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can modify meeting settings", 403);
    }
    Object.assign(meeting, req.body);
    await meeting.save();
    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting
    });
  } catch (error) {
    next(error);
  }
};
const deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can cancel this meeting", 403);
    }
    meeting.status = "cancelled";
    await meeting.save();
    res.status(200).json({
      success: true,
      message: "Meeting cancelled successfully"
    });
  } catch (error) {
    next(error);
  }
};
const joinMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { displayName, passcode, identity: reqIdentity } = req.body;
    const meeting = await Meeting.findOne({ meetingCode: code });
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (meeting.status === "ended") {
      throw new AppError("This meeting has ended", 400);
    }
    if (meeting.status === "cancelled") {
      throw new AppError("This meeting has been cancelled", 400);
    }
    if (meeting.isLocked) {
      throw new AppError("This meeting has been locked by the host", 403);
    }
    const isHost = req.user?.id && String(meeting.hostId) === req.user.id;
    if (meeting.passcode && !isHost) {
      if (!passcode || passcode !== meeting.passcode) {
        throw new AppError("Incorrect meeting passcode", 401);
      }
    }
    const participantIdentity = reqIdentity || (req.user ? `user-${req.user.id}` : `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    const finalDisplayName = req.user?.name || displayName || "Guest Participant";
    const role = isHost ? "host" : "participant";
    if (meeting.isWaitingRoomEnabled && !isHost) {
      let participant = await MeetingParticipant.findOne({
        meetingId: meeting._id,
        ...(req.user ? { userId: req.user.id } : { displayName: finalDisplayName })
      });
      if (!participant || participant.status === "waiting") {
        if (!participant) {
          participant = await MeetingParticipant.create({
            meetingId: meeting._id,
            userId: req.user ? req.user.id : null,
            displayName: finalDisplayName,
            role: "participant",
            status: "waiting"
          });
        }
        res.status(200).json({
          success: true,
          inWaitingRoom: true,
          message: "Waiting for the host to admit you",
          participantId: participant._id,
          participantIdentity,
          meeting: {
            title: meeting.title,
            meetingCode: meeting.meetingCode
          }
        });
        return;
      }
      if (participant.status === "rejected" || participant.status === "removed") {
        throw new AppError("You have been removed or denied entry to this meeting", 403);
      }
    }
    if (isHost && meeting.status === "scheduled") {
      meeting.status = "active";
      meeting.actualStartTime = meeting.actualStartTime || /* @__PURE__ */ new Date();
      await meeting.save();
    }
    const token = await livekitService.generateToken({
      roomName: meeting.meetingCode,
      participantIdentity,
      participantName: finalDisplayName,
      isHost: !!isHost,
      canPublish: true,
      canSubscribe: true,
      canPublishData: meeting.chatEnabled
    });
    res.status(200).json({
      success: true,
      inWaitingRoom: false,
      token,
      livekitUrl: env.LIVEKIT_URL,
      role,
      participantIdentity,
      displayName: finalDisplayName,
      meeting: {
        id: meeting._id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        status: meeting.status,
        chatEnabled: meeting.chatEnabled,
        allowScreenShare: meeting.allowScreenShare,
        allowParticipantUnmute: meeting.allowParticipantUnmute
      }
    });
  } catch (error) {
    next(error);
  }
};
const endMeeting = async (req, res, next) => {
  try {
    const { code } = req.params;
    const meeting = await Meeting.findOne({ meetingCode: code });
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can end the meeting for everyone", 403);
    }
    const endTime = /* @__PURE__ */ new Date();
    meeting.status = "ended";
    meeting.actualEndTime = endTime;
    await meeting.save();
    await attendanceService.reconcileMeetingSessions(meeting._id, endTime);
    await livekitService.deleteRoom(meeting.meetingCode);
    res.status(200).json({
      success: true,
      message: "Meeting ended successfully for all participants"
    });
  } catch (error) {
    next(error);
  }
};
export {
  createMeeting,
  createMeetingSchema,
  deleteMeeting,
  endMeeting,
  generateMeetingCode,
  getMeetingByCode,
  joinMeeting,
  joinMeetingSchema,
  listMeetings,
  updateMeeting,
  updateMeetingSchema
};
