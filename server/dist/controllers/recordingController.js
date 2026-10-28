"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRecording = exports.startRecording = exports.getRecordings = void 0;
const Meeting_js_1 = require("../models/Meeting.js");
const Recording_js_1 = require("../models/Recording.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const getRecordings = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can access meeting recordings', 403);
        }
        const recordings = await Recording_js_1.Recording.find({ meetingId: meeting._id }).sort({ startedAt: -1 });
        res.status(200).json({
            success: true,
            recordings,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecordings = getRecordings;
const startRecording = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can start a recording', 403);
        }
        // Check if an active recording is already running
        const active = await Recording_js_1.Recording.findOne({ meetingId: meeting._id, status: { $in: ['starting', 'active'] } });
        if (active) {
            throw new errorHandler_js_1.AppError('A recording session is already running', 400);
        }
        const recording = await Recording_js_1.Recording.create({
            meetingId: meeting._id,
            status: 'active',
            startedAt: new Date(),
            initiatorId: req.user.id,
        });
        res.status(201).json({
            success: true,
            message: 'Recording started',
            recording,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.startRecording = startRecording;
const stopRecording = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can stop recording', 403);
        }
        const recording = await Recording_js_1.Recording.findOne({
            meetingId: meeting._id,
            status: 'active',
        }).sort({ startedAt: -1 });
        if (!recording) {
            throw new errorHandler_js_1.AppError('No active recording session found for this meeting', 404);
        }
        const endedAt = new Date();
        const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - recording.startedAt.getTime()) / 1000));
        recording.status = 'ready';
        recording.endedAt = endedAt;
        recording.durationSeconds = durationSeconds;
        // Simulated or configured download URL
        recording.downloadUrl = `/recordings/${meeting.meetingCode}-${recording._id}.mp4`;
        await recording.save();
        res.status(200).json({
            success: true,
            message: 'Recording stopped and metadata saved',
            recording,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.stopRecording = stopRecording;
