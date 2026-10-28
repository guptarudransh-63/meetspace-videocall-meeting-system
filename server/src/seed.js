import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Meeting } from "./models/Meeting.js";
import { ChatMessage } from "./models/ChatMessage.js";
import { AttendanceSession } from "./models/AttendanceSession.js";
const seed = async () => {
  await connectDB();
  console.log("Seeding MeetSpace database...");
  await User.deleteMany({});
  await Meeting.deleteMany({});
  await ChatMessage.deleteMany({});
  await AttendanceSession.deleteMany({});
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);
  const hostUser = await User.create({
    name: "Sarah Connor (Host)",
    email: "host@meetspace.dev",
    passwordHash,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    timezone: "America/New_York",
    role: "user"
  });
  const guestUser = await User.create({
    name: "Alex Miller (Engineer)",
    email: "alex@meetspace.dev",
    passwordHash,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    timezone: "America/Los_Angeles",
    role: "user"
  });
  const adminUser = await User.create({
    name: "Admin System",
    email: "admin@meetspace.dev",
    passwordHash,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    timezone: "UTC",
    role: "admin"
  });
  console.log("Created Users:");
  console.log("  1. Host: host@meetspace.dev / password123");
  console.log("  2. Participant: alex@meetspace.dev / password123");
  console.log("  3. Admin: admin@meetspace.dev / password123");
  const scheduledMeeting = await Meeting.create({
    meetingCode: "eng-sync-2025",
    title: "Weekly Engineering All-Hands",
    description: "Sprint retrospective, architecture review, and live demonstration of MeetSpace platform.",
    hostId: hostUser._id,
    scheduledStartTime: new Date(Date.now() + 2 * 60 * 60 * 1e3),
    // 2 hours from now
    scheduledDuration: 45,
    status: "scheduled",
    isWaitingRoomEnabled: true,
    maxParticipants: 50,
    chatEnabled: true,
    allowScreenShare: true,
    allowParticipantUnmute: true
  });
  const pastMeeting = await Meeting.create({
    meetingCode: "prod-ret-q1",
    title: "Q1 Production Launch Debrief",
    description: "Post-launch metrics, stability discussion, and attendance reporting review.",
    hostId: hostUser._id,
    scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1e3),
    actualStartTime: new Date(Date.now() - 24 * 60 * 60 * 1e3),
    actualEndTime: new Date(Date.now() - 23 * 60 * 60 * 1e3),
    scheduledDuration: 60,
    status: "ended",
    isWaitingRoomEnabled: false
  });
  await AttendanceSession.create([
    {
      meetingId: pastMeeting._id,
      userId: hostUser._id,
      displayName: hostUser.name,
      participantIdentity: `user-${hostUser._id}`,
      joinTime: new Date(Date.now() - 24 * 60 * 60 * 1e3),
      leaveTime: new Date(Date.now() - 23 * 60 * 60 * 1e3),
      durationSeconds: 3600,
      disconnectedCleanly: true
    },
    {
      meetingId: pastMeeting._id,
      userId: guestUser._id,
      displayName: guestUser.name,
      participantIdentity: `user-${guestUser._id}`,
      joinTime: new Date(Date.now() - 24 * 60 * 60 * 1e3 + 12e4),
      leaveTime: new Date(Date.now() - 23 * 60 * 60 * 1e3 - 6e4),
      durationSeconds: 3420,
      disconnectedCleanly: true
    }
  ]);
  await ChatMessage.create([
    {
      meetingId: pastMeeting._id,
      senderId: hostUser._id,
      senderName: hostUser.name,
      senderRole: "host",
      message: "Welcome everyone to the debrief!"
    },
    {
      meetingId: pastMeeting._id,
      senderId: guestUser._id,
      senderName: guestUser.name,
      senderRole: "participant",
      message: "Excited to review the latency metrics and WebRTC performance."
    }
  ]);
  console.log(`Demo meetings created: ${scheduledMeeting.meetingCode}, ${pastMeeting.meetingCode}`);
  console.log("Seeding completed successfully!");
  await disconnectDB();
  process.exit(0);
};
seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
