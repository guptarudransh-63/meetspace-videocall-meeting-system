"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_js_1 = require("./config/db.js");
const User_js_1 = require("./models/User.js");
const Meeting_js_1 = require("./models/Meeting.js");
const ChatMessage_js_1 = require("./models/ChatMessage.js");
const AttendanceSession_js_1 = require("./models/AttendanceSession.js");
const seed = async () => {
    await (0, db_js_1.connectDB)();
    console.log('Seeding MeetSpace database...');
    // Clear existing collections
    await User_js_1.User.deleteMany({});
    await Meeting_js_1.Meeting.deleteMany({});
    await ChatMessage_js_1.ChatMessage.deleteMany({});
    await AttendanceSession_js_1.AttendanceSession.deleteMany({});
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash('password123', salt);
    // Create Users
    const hostUser = await User_js_1.User.create({
        name: 'Sarah Connor (Host)',
        email: 'host@meetspace.dev',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        timezone: 'America/New_York',
        role: 'user',
    });
    const guestUser = await User_js_1.User.create({
        name: 'Alex Miller (Engineer)',
        email: 'alex@meetspace.dev',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        timezone: 'America/Los_Angeles',
        role: 'user',
    });
    const adminUser = await User_js_1.User.create({
        name: 'Admin System',
        email: 'admin@meetspace.dev',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        timezone: 'UTC',
        role: 'admin',
    });
    console.log('Created Users:');
    console.log('  1. Host: host@meetspace.dev / password123');
    console.log('  2. Participant: alex@meetspace.dev / password123');
    console.log('  3. Admin: admin@meetspace.dev / password123');
    // Create Demo Meetings
    const scheduledMeeting = await Meeting_js_1.Meeting.create({
        meetingCode: 'eng-sync-2025',
        title: 'Weekly Engineering All-Hands',
        description: 'Sprint retrospective, architecture review, and live demonstration of MeetSpace platform.',
        hostId: hostUser._id,
        scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        scheduledDuration: 45,
        status: 'scheduled',
        isWaitingRoomEnabled: true,
        maxParticipants: 50,
        chatEnabled: true,
        allowScreenShare: true,
        allowParticipantUnmute: true,
    });
    const pastMeeting = await Meeting_js_1.Meeting.create({
        meetingCode: 'prod-ret-q1',
        title: 'Q1 Production Launch Debrief',
        description: 'Post-launch metrics, stability discussion, and attendance reporting review.',
        hostId: hostUser._id,
        scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
        scheduledDuration: 60,
        status: 'ended',
        isWaitingRoomEnabled: false,
    });
    // Seed attendance for past meeting
    await AttendanceSession_js_1.AttendanceSession.create([
        {
            meetingId: pastMeeting._id,
            userId: hostUser._id,
            displayName: hostUser.name,
            participantIdentity: `user-${hostUser._id}`,
            joinTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
            leaveTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
            durationSeconds: 3600,
            disconnectedCleanly: true,
        },
        {
            meetingId: pastMeeting._id,
            userId: guestUser._id,
            displayName: guestUser.name,
            participantIdentity: `user-${guestUser._id}`,
            joinTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 120000),
            leaveTime: new Date(Date.now() - 23 * 60 * 60 * 1000 - 60000),
            durationSeconds: 3420,
            disconnectedCleanly: true,
        },
    ]);
    // Seed sample chat
    await ChatMessage_js_1.ChatMessage.create([
        {
            meetingId: pastMeeting._id,
            senderId: hostUser._id,
            senderName: hostUser.name,
            senderRole: 'host',
            message: 'Welcome everyone to the debrief!',
        },
        {
            meetingId: pastMeeting._id,
            senderId: guestUser._id,
            senderName: guestUser.name,
            senderRole: 'participant',
            message: 'Excited to review the latency metrics and WebRTC performance.',
        },
    ]);
    console.log(`Demo meetings created: ${scheduledMeeting.meetingCode}, ${pastMeeting.meetingCode}`);
    console.log('Seeding completed successfully!');
    await (0, db_js_1.disconnectDB)();
    process.exit(0);
};
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
