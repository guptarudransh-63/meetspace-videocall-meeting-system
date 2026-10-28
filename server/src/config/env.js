import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
const envSchema = z.object({
  PORT: z.string().default("5001"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/meetspace"),
  JWT_SECRET: z.string().min(16).default("super-secret-meetspace-jwt-token-key-2025-at-least-32-chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECRET: z.string().default("super-secret-meetspace-cookie-encryption-key-2025"),
  LIVEKIT_URL: z.string().default("ws://localhost:7880"),
  LIVEKIT_API_KEY: z.string().default("devkey"),
  LIVEKIT_API_SECRET: z.string().default("secret")
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}
const env = parsed.data;
export {
  env
};
