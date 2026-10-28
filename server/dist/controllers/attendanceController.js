"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAttendanceCSV = exports.getAttendanceReport = void 0;
const Meeting_js_1 = require("../models/Meeting.js");
const attendanceService_js_1 = require("../services/attendanceService.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const getAttendanceReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host or admin can view the attendance report', 403);
        }
        const report = await attendanceService_js_1.attendanceService.getMeetingAttendanceReport(meeting._id);
        res.status(200).json({
            success: true,
            report,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAttendanceReport = getAttendanceReport;
const downloadAttendanceCSV = async (req, res, next) => {
    try {
        const { id } = req.params;
        const meeting = await Meeting_js_1.Meeting.findById(id);
        if (!meeting) {
            throw new errorHandler_js_1.AppError('Meeting not found', 404);
        }
        if (String(meeting.hostId) !== req.user.id && req.user.role !== 'admin') {
            throw new errorHandler_js_1.AppError('Only the host can export the attendance report', 403);
        }
        const csvData = await attendanceService_js_1.attendanceService.generateCSV(meeting._id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${meeting.meetingCode}-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.status(200).send(csvData);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadAttendanceCSV = downloadAttendanceCSV;
