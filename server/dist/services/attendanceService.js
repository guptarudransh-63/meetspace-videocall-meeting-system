"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceService = exports.AttendanceService = void 0;
const mongoose_1 = require("mongoose");
const AttendanceSession_js_1 = require("../models/AttendanceSession.js");
const Meeting_js_1 = require("../models/Meeting.js");
const json2csv_1 = require("json2csv");
class AttendanceService {
    /**
     * Records the start of a participant session
     */
    async recordJoin(params) {
        const session = await AttendanceSession_js_1.AttendanceSession.create({
            meetingId: new mongoose_1.Types.ObjectId(params.meetingId),
            userId: params.userId ? new mongoose_1.Types.ObjectId(params.userId) : null,
            displayName: params.displayName,
            participantIdentity: params.participantIdentity,
            socketId: params.socketId || null,
            joinTime: new Date(),
            clientInfo: params.clientInfo || {},
            disconnectedCleanly: true,
        });
        return session;
    }
    /**
     * Records the end of a participant session and calculates duration
     */
    async recordLeave(params) {
        const query = {
            participantIdentity: params.participantIdentity,
            leaveTime: null,
        };
        if (params.meetingId) {
            query.meetingId = new mongoose_1.Types.ObjectId(params.meetingId);
        }
        if (params.socketId) {
            query.socketId = params.socketId;
        }
        // Find the open session
        const session = await AttendanceSession_js_1.AttendanceSession.findOne(query).sort({ joinTime: -1 });
        if (!session) {
            return null;
        }
        const leaveTime = new Date();
        const durationSeconds = Math.max(0, Math.floor((leaveTime.getTime() - session.joinTime.getTime()) / 1000));
        session.leaveTime = leaveTime;
        session.durationSeconds = durationSeconds;
        session.disconnectedCleanly = params.cleanDisconnect ?? true;
        await session.save();
        return session;
    }
    /**
     * Reconciles all open attendance sessions when a meeting ends
     */
    async reconcileMeetingSessions(meetingId, endTime = new Date()) {
        const openSessions = await AttendanceSession_js_1.AttendanceSession.find({
            meetingId: new mongoose_1.Types.ObjectId(meetingId),
            leaveTime: null,
        });
        for (const session of openSessions) {
            const durationSeconds = Math.max(0, Math.floor((endTime.getTime() - session.joinTime.getTime()) / 1000));
            session.leaveTime = endTime;
            session.durationSeconds = durationSeconds;
            session.disconnectedCleanly = false; // forced close on meeting end
            await session.save();
        }
        return openSessions.length;
    }
    /**
     * Aggregate attendance report per participant (grouping multiple rejoin sessions)
     */
    async getMeetingAttendanceReport(meetingId) {
        const mId = new mongoose_1.Types.ObjectId(meetingId);
        const meeting = await Meeting_js_1.Meeting.findById(mId);
        const sessions = await AttendanceSession_js_1.AttendanceSession.find({ meetingId: mId })
            .populate('userId', 'name email avatarUrl')
            .sort({ joinTime: 1 });
        // Aggregated stats by participantIdentity
        const participantMap = new Map();
        for (const s of sessions) {
            const existing = participantMap.get(s.participantIdentity);
            const user = s.userId;
            if (!existing) {
                participantMap.set(s.participantIdentity, {
                    identity: s.participantIdentity,
                    displayName: s.displayName,
                    email: user?.email,
                    firstJoined: s.joinTime,
                    lastLeft: s.leaveTime || undefined,
                    totalDurationSeconds: s.durationSeconds,
                    sessionsCount: 1,
                    sessions: [
                        {
                            joinTime: s.joinTime,
                            leaveTime: s.leaveTime || undefined,
                            durationSeconds: s.durationSeconds,
                            clean: s.disconnectedCleanly,
                        },
                    ],
                });
            }
            else {
                existing.totalDurationSeconds += s.durationSeconds;
                existing.sessionsCount += 1;
                if (s.leaveTime) {
                    existing.lastLeft = s.leaveTime;
                }
                existing.sessions.push({
                    joinTime: s.joinTime,
                    leaveTime: s.leaveTime || undefined,
                    durationSeconds: s.durationSeconds,
                    clean: s.disconnectedCleanly,
                });
            }
        }
        return {
            meeting: {
                id: meeting?._id,
                title: meeting?.title,
                meetingCode: meeting?.meetingCode,
                actualStartTime: meeting?.actualStartTime,
                actualEndTime: meeting?.actualEndTime,
                status: meeting?.status,
            },
            totalUniqueParticipants: participantMap.size,
            totalSessions: sessions.length,
            participants: Array.from(participantMap.values()),
        };
    }
    /**
     * Generate CSV format export for attendance
     */
    async generateCSV(meetingId) {
        const report = await this.getMeetingAttendanceReport(meetingId);
        const fields = [
            { label: 'Participant Name', value: 'displayName' },
            { label: 'Email', value: (row) => row.email || 'Guest' },
            { label: 'Participant Identity', value: 'identity' },
            { label: 'First Joined', value: (row) => row.firstJoined.toISOString() },
            { label: 'Last Left', value: (row) => (row.lastLeft ? row.lastLeft.toISOString() : 'Active/Unknown') },
            { label: 'Total Duration (Seconds)', value: 'totalDurationSeconds' },
            {
                label: 'Total Duration (Minutes)',
                value: (row) => (row.totalDurationSeconds / 60).toFixed(1),
            },
            { label: 'Number of Sessions', value: 'sessionsCount' },
        ];
        const json2csvParser = new json2csv_1.Parser({ fields });
        const csv = json2csvParser.parse(report.participants);
        return csv;
    }
}
exports.AttendanceService = AttendanceService;
exports.attendanceService = new AttendanceService();
