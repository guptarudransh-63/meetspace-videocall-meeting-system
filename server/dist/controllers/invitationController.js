"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadIcs = exports.getInvitations = exports.createInvitations = exports.inviteSchema = void 0;
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const Meeting_js_1 = require("../models/Meeting.js");
const Invitation_js_1 = require("../models/Invitation.js");
const icsService_js_1 = require("../services/icsService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const env_js_1 = require("../config/env.js");
exports.inviteSchema = zod_1.z.object({
    emails: zod_1.z.array(zod_1.z.string().email()).min(1, 'Provide at least one email address'),
});
const createInvitations = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { emails } = req.body;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can invite participants', 403);
        }
        const expiresAt = meeting.scheduledStartTime
            ? new Date(meeting.scheduledStartTime.getTime() + (meeting.scheduledDuration + 1440) * 60 * 1000)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const createdInvitations = [];
        for (const email of emails) {
            const token = crypto_1.default.randomBytes(24).toString('hex');
            const inv = await Invitation_js_1.Invitation.findOneAndUpdate({ meetingId: meeting._id, inviteeEmail: email.toLowerCase() }, {
                token,
                status: 'pending',
                invitedBy: req.user.id,
                expiresAt,
            }, { upsert: true, new: true });
            createdInvitations.push({ email: inv.inviteeEmail, status: inv.status });
        }
        res.status(200).json({
            success: true,
            message: `Invitations created for ${createdInvitations.length} recipients`,
            invitations: createdInvitations,
            shareableLink: `${env_js_1.env.CLIENT_URL}/meeting/${meeting.meetingCode}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createInvitations = createInvitations;
const getInvitations = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invitations = await Invitation_js_1.Invitation.find({ meetingId: id }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            invitations,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInvitations = getInvitations;
const downloadIcs = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id).populate('hostId', 'name email');
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        const host = meeting.hostId;
        const icsContent = icsService_js_1.icsService.generateCalendarEvent(meeting, host?.name || 'MeetSpace Host', host?.email || 'host@meetspace.dev');
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="meetspace-${meeting.meetingCode}.ics"`);
        res.send(icsContent);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadIcs = downloadIcs;
