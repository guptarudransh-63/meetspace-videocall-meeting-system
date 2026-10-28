import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Meeting } from "../src/models/Meeting.js";
const app = createApp();
describe("Meeting APIs & Lifecycle", () => {
  let hostToken = "";
  let hostId = "";
  let guestToken = "";
  let meetingCode = "";
  let meetingId = "";
  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /meetingtest.*@meetspace\.dev/ });
    const hostRes = await request(app).post("/api/v1/auth/register").send({
      name: "Host User",
      email: "meetingtesthost@meetspace.dev",
      password: "password123"
    });
    hostToken = hostRes.body.token;
    hostId = hostRes.body.user.id;
    const guestRes = await request(app).post("/api/v1/auth/register").send({
      name: "Guest User",
      email: "meetingtestguest@meetspace.dev",
      password: "password123"
    });
    guestToken = guestRes.body.token;
  });
  afterAll(async () => {
    if (meetingCode) {
      await Meeting.deleteMany({ meetingCode });
    }
    await User.deleteMany({ email: /meetingtest.*@meetspace\.dev/ });
    await disconnectDB();
  });
  it("should create an instant meeting", async () => {
    const res = await request(app).post("/api/v1/meetings").set("Authorization", `Bearer ${hostToken}`).send({
      title: "Instant Sync Call",
      isInstant: true,
      isWaitingRoomEnabled: true,
      passcode: "secret123"
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.meeting).toHaveProperty("meetingCode");
    meetingCode = res.body.meeting.meetingCode;
    meetingId = res.body.meeting._id;
  });
  it("should retrieve meeting pre-join information by code", async () => {
    const res = await request(app).get(`/api/v1/meetings/${meetingCode}`);
    expect(res.status).toBe(200);
    expect(res.body.meeting.title).toBe("Instant Sync Call");
    expect(res.body.meeting.requiresPasscode).toBe(true);
    expect(res.body.meeting.isWaitingRoomEnabled).toBe(true);
  });
  it("should reject join request with wrong passcode", async () => {
    const res = await request(app).post(`/api/v1/meetings/${meetingCode}/join`).set("Authorization", `Bearer ${guestToken}`).send({
      displayName: "Guest User",
      passcode: "wrongcode"
    });
    expect(res.status).toBe(401);
  });
  it("should place non-host participant in waiting room when enabled", async () => {
    const res = await request(app).post(`/api/v1/meetings/${meetingCode}/join`).set("Authorization", `Bearer ${guestToken}`).send({
      displayName: "Guest User",
      passcode: "secret123"
    });
    expect(res.status).toBe(200);
    expect(res.body.inWaitingRoom).toBe(true);
  });
  it("should admit host directly and return LiveKit SFU token", async () => {
    const res = await request(app).post(`/api/v1/meetings/${meetingCode}/join`).set("Authorization", `Bearer ${hostToken}`).send({
      displayName: "Host User"
    });
    expect(res.status).toBe(200);
    expect(res.body.inWaitingRoom).toBe(false);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("host");
  });
  it("should prevent non-host from ending the meeting", async () => {
    const res = await request(app).post(`/api/v1/meetings/${meetingCode}/end`).set("Authorization", `Bearer ${guestToken}`);
    expect(res.status).toBe(403);
  });
  it("should allow host to end meeting for everyone", async () => {
    const res = await request(app).post(`/api/v1/meetings/${meetingCode}/end`).set("Authorization", `Bearer ${hostToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const check = await Meeting.findOne({ meetingCode });
    expect(check?.status).toBe("ended");
  });
});
