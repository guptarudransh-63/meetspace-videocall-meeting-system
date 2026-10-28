import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";
const app = createApp();
describe("Auth APIs", () => {
  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({ email: /test.*@meetspace\.dev/ });
  });
  afterAll(async () => {
    await User.deleteMany({ email: /test.*@meetspace\.dev/ });
    await disconnectDB();
  });
  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Test Participant",
      email: "testuser@meetspace.dev",
      password: "password123",
      timezone: "America/New_York"
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("testuser@meetspace.dev");
    expect(res.body).toHaveProperty("token");
  });
  it("should not allow duplicate registration with the same email", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "Duplicate User",
      email: "testuser@meetspace.dev",
      password: "password123"
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
  it("should log in with valid credentials", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "testuser@meetspace.dev",
      password: "password123"
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: "testuser@meetspace.dev",
      password: "wrongpassword"
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  it("should access /api/v1/auth/me with valid Bearer token", async () => {
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "testuser@meetspace.dev",
      password: "password123"
    });
    const token = loginRes.body.token;
    const meRes = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe("testuser@meetspace.dev");
  });
});
