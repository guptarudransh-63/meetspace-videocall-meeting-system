"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endMeeting = exports.joinMeeting = exports.deleteMeeting = exports.updateMeeting = exports.getMeetingByCode = exports.listMeetings = exports.createMeeting = exports.joinMeetingSchema = exports.updateMeetingSchema = exports.createMeetingSchema = exports.generateMeetingCode = void 0;
const zod_1 = require("zod");
const Meeting_js_1 = require("../models/Meeting.js");
const MeetingParticipant_js_1 = require("../models/MeetingParticipant.js");
const livekitService_js_1 = require("../services/livekitService.js");
const attendanceService_js_1 = require("../services/attendanceService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const env_js_1 = require("../config/env.js");
// Helper to generate readable meeting code e.g. "abc-defg-hij"
const generateMeetingCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = (len) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `${segment(3)}-${segment(4)}-${segment(3)}`;
};
exports.generateMeetingCode = generateMeetingCode;
exports.createMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Meeting title is required').max(120),
    description: zod_1.z.string().max(500).optional().default(''),
    isInstant: zod_1.z.boolean().optional().default(false),
    scheduledStartTime: zod_1.z.string().datetime().optional(),
    scheduledDuration: zod_1.z.number().min(5).max(1440).optional().default(30),
    passcode: zod_1.z.string().max(20).optional().or(zod_1.z.literal('')),
    isWaitingRoomEnabled: zod_1.z.boolean().optional().default(false),
    maxParticipants: zod_1.z.number().min(2).max(500).optional().default(100),
    chatEnabled: zod_1.z.boolean().optional().default(true),
    allowScreenShare: zod_1.z.boolean().optional().default(true),
    allowParticipantUnmute: zod_1.z.boolean().optional().default(true),
});
exports.updateMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(120).optional(),
    description: zod_1.z.string().max(500).optional(),
    scheduledStartTime: zod_1.z.string().datetime().optional(),
    scheduledDuration: zod_1.z.number().min(5).max(1440).optional(),
    passcode: zod_1.z.string().max(20).optional().or(zod_1.z.literal('')),
    isWaitingRoomEnabled: zod_1.z.boolean().optional(),
    isLocked: zod_1.z.boolean().optional(),
    chatEnabled: zod_1.z.boolean().optional(),
    allowScreenShare: zod_1.z.boolean().optional(),
    allowParticipantUnmute: zod_1.z.boolean().optional(),
});
exports.joinMeetingSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1, 'Display name is required').max(50),
    passcode: zod_1.z.string().optional(),
    identity: zod_1.z.string().optional(),
});
const createMeeting = async (req, res, next) => {
    try {
        const { title, description, isInstant, scheduledStartTime, scheduledDuration, passcode, isWaitingRoomEnabled, maxParticipants, chatEnabled, allowScreenShare, allowParticipantUnmute, } = req.body;
        let code = (0, exports.generateMeetingCode)();
        while (await Meeting_js_1.Meeting.findOne({ meetingCode: code })) {
            code = (0, exports.generateMeetingCode)();
        }
        const meeting = await Meeting_js_1.Meeting.create({
            meetingCode: code,
            title,
            description,
            hostId: req.user.id,
            scheduledStartTime: isInstant ? new Date() : scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
            scheduledDuration: scheduledDuration || 30,
            actualStartTime: isInstant ? new Date() : undefined,
            status: isInstant ? 'active' : 'scheduled',
            passcode: passcode || null,
            isWaitingRoomEnabled: !!isWaitingRoomEnabled,
            maxParticipants: maxParticipants || 100,
            chatEnabled: chatEnabled !== false,
            allowScreenShare: allowScreenShare !== false,
            allowParticipantUnmute: allowParticipantUnmute !== false,
        });
        res.status(201).json({
            success: true,
            message: 'Meeting created successfully',
            meeting,
            joinUrl: `${env_js_1.env.CLIENT_URL}/meeting/${meeting.meetingCode}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMeeting = createMeeting;
const listMeetings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { type = 'all', page = 1, limit = 20, search = '' } = req.query;
        const query = { hostId: userId };
        if (search) {
            query.title = { $regex: String(search), $options: 'i' };
        }
        const now = new Date();
        if (type === 'upcoming') {
            query.status = { $in: ['scheduled', 'active'] };
        }
        else if (type === 'past') {
            query.status = 'ended';
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [meetings, total] = await Promise.all([
            Meeting_js_1.Meeting.find(query)
                .sort({ scheduledStartTime: type === 'past' ? -1 : 1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Meeting_js_1.Meeting.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            meetings,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.listMeetings = listMeetings;
const getMeetingByCode = async (req, res, next) => {
    try {
        const { code } = req.params;
        const meeting = await Meeting_js_1.Meeting.findOne({ meetingCode: code }).populate('hostId', 'name email avatarUrl');
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
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
                isHost: !!isHost,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMeetingByCode = getMeetingByCode;
const updateMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can modify meeting settings', 403);
        }
        Object.assign(meeting, req.body);
        await meeting.save();
        res.status(200).json({
            success: true,
            message: 'Meeting updated successfully',
            meeting,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMeeting = updateMeeting;
const deleteMeeting = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can cancel this meeting', 403);
        }
        meeting.status = 'cancelled';
        await meeting.save();
        res.status(200).json({
            success: true,
            message: 'Meeting cancelled successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMeeting = deleteMeeting;
const joinMeeting = async (req, res, next) => {
    try {
        const { code } = req.params;
        const { displayName, passcode, identity: reqIdentity } = req.body;
        const meeting = await Meeting_js_1.Meeting.findOne({ meetingCode: code });
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (meeting.status === 'ended') {
            throw new errorHandler_js_1.AppError('This meeting has ended', 400);
        }
        if (meeting.status === 'cancelled') {
            throw new errorHandler_js_1.AppError('This meeting has been cancelled', 400);
        }
        if (meeting.isLocked) {
            throw new errorHandler_js_1.AppError('This meeting has been locked by the host', 403);
        }
        const isHost = req.user?.id && String(meeting.hostId) === req.user.id;
        // Check passcode if required and not host
        if (meeting.passcode && !isHost) {
            if (!passcode || passcode !== meeting.passcode) {
                throw new errorHandler_js_1.AppError('Incorrect meeting passcode', 401);
            }
        }
        const participantIdentity = reqIdentity || (req.user ? `user-${req.user.id}` : `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
        const finalDisplayName = req.user?.name || displayName || 'Guest Participant';
        const role = isHost ? 'host' : 'participant';
        // If waiting room is enabled and not host, check admission status
        if (meeting.isWaitingRoomEnabled && !isHost) {
            let participant = await MeetingParticipant_js_1.MeetingParticipant.findOne({
                meetingId: meeting._id,
                $or: [{ userId: req.user ? req.user.id : null }, { displayName: finalDisplayName }],
            });
            if (!participant || participant.status === 'waiting') {
                if (!participant) {
                    participant = await MeetingParticipant_js_1.MeetingParticipant.create({
                        meetingId: meeting._id,
                        userId: req.user ? req.user.id : null,
                        displayName: finalDisplayName,
                        role: 'participant',
                        status: 'waiting',
                    });
                }
                res.status(200).json({
                    success: true,
                    inWaitingRoom: true,
                    message: 'Waiting for the host to admit you',
                    participantId: participant._id,
                    meeting: {
                        title: meeting.title,
                        meetingCode: meeting.meetingCode,
                    },
                });
                return;
            }
            if (participant.status === 'rejected' || participant.status === 'removed') {
                throw new errorHandler_js_1.AppError('You have been removed or denied entry to this meeting', 403);
            }
        }
        // Advance meeting status to active if host enters
        if (isHost && meeting.status === 'scheduled') {
            meeting.status = 'active';
            meeting.actualStartTime = meeting.actualStartTime || new Date();
            await meeting.save();
        }
        // Generate LiveKit token
        const token = await livekitService_js_1.livekitService.generateToken({
            roomName: meeting.meetingCode,
            participantIdentity,
            participantName: finalDisplayName,
            isHost: !!isHost,
            canPublish: true,
            canSubscribe: true,
            canPublishData: meeting.chatEnabled,
        });
        res.status(200).json({
            success: true,
            inWaitingRoom: false,
            token,
            livekitUrl: env_js_1.env.LIVEKIT_URL,
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
                allowParticipantUnmute: meeting.allowParticipantUnmute,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.joinMeeting = joinMeeting;
const endMeeting = async (req, res, next) => {
    try {
        const { code } = req.params;
        const meeting = await Meeting_js_1.Meeting.findOne({ meetingCode: code });
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can end the meeting for everyone', 403);
        }
        const endTime = new Date();
        meeting.status = 'ended';
        meeting.actualEndTime = endTime;
        await meeting.save();
        // Reconcile open attendance sessions
        await attendanceService_js_1.attendanceService.reconcileMeetingSessions(meeting._id, endTime);
        // Terminate room on LiveKit SFU
        await livekitService_js_1.livekitService.deleteRoom(meeting.meetingCode);
        res.status(200).json({
            success: true,
            message: 'Meeting ended successfully for all participants',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.endMeeting = endMeeting;
