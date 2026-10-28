import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Meeting } from "../src/models/Meeting.js";
import { User } from "../src/models/User.js";
import { AttendanceSession } from "../src/models/AttendanceSession.js";
import { attendanceService } from "../src/services/attendanceService.js";
describe("Attendance Service & Reporting", () => {
  let testMeetingId;
  let testUserId;
  beforeAll(async () => {
    await connectDB();
    const user = await User.create({
      name: "Attendance Tester",
      email: "attendance_isolated_99@meetspace.dev",
      passwordHash: "dummy"
    });
    testUserId = user._id;
    const meeting = await Meeting.create({
      meetingCode: "att-test-123",
      title: "Attendance Verification Call",
      hostId: testUserId,
      status: "active",
      actualStartTime: new Date(Date.now() - 36e5)
    });
    testMeetingId = meeting._id;
  });
  afterAll(async () => {
    await AttendanceSession.deleteMany({ meetingId: testMeetingId });
    await Meeting.deleteMany({ _id: testMeetingId });
    await User.deleteMany({ _id: testUserId });
    await disconnectDB();
  });
  it("should record participant join session correctly", async () => {
    const session = await attendanceService.recordJoin({
      meetingId: testMeetingId,
      userId: testUserId,
      displayName: "Attendance Tester",
      participantIdentity: `user-${testUserId}`,
      socketId: "sock-12345"
    });
    expect(session).toBeDefined();
    expect(session.displayName).toBe("Attendance Tester");
    expect(session.leaveTime).toBeNull();
  });
  it("should record participant leave session and calculate duration", async () => {
    const session = await attendanceService.recordLeave({
      participantIdentity: `user-${testUserId}`,
      meetingId: testMeetingId,
      socketId: "sock-12345",
      cleanDisconnect: true
    });
    expect(session).toBeDefined();
    expect(session?.leaveTime).toBeInstanceOf(Date);
    expect(session?.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(session?.disconnectedCleanly).toBe(true);
  });
  it("should aggregate multi-session reconnects in attendance report", async () => {
    const session2 = await attendanceService.recordJoin({
      meetingId: testMeetingId,
      userId: testUserId,
      displayName: "Attendance Tester",
      participantIdentity: `user-${testUserId}`,
      socketId: "sock-67890"
    });
    await attendanceService.recordLeave({
      participantIdentity: `user-${testUserId}`,
      meetingId: testMeetingId,
      socketId: "sock-67890",
      cleanDisconnect: true
    });
    const report = await attendanceService.getMeetingAttendanceReport(testMeetingId);
    expect(report.totalUniqueParticipants).toBe(1);
    expect(report.totalSessions).toBe(2);
    expect(report.participants[0].sessionsCount).toBe(2);
    expect(report.participants[0].totalDurationSeconds).toBeGreaterThanOrEqual(0);
  });
  it("should generate valid CSV attendance export", async () => {
    const csv = await attendanceService.generateCSV(testMeetingId);
    expect(csv).toContain('"Participant Name"');
    expect(csv).toContain('"Attendance Tester"');
    expect(csv).toContain("attendance_isolated_99@meetspace.dev");
  });
});
