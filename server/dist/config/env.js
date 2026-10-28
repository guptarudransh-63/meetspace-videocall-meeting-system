"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5001'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
    MONGODB_URI: zod_1.z.string().default('mongodb://127.0.0.1:27017/meetspace'),
    JWT_SECRET: zod_1.z.string().min(16).default('super-secret-meetspace-jwt-token-key-2025-at-least-32-chars'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    COOKIE_SECRET: zod_1.z.string().default('super-secret-meetspace-cookie-encryption-key-2025'),
    LIVEKIT_URL: zod_1.z.string().default('ws://localhost:7880'),
    LIVEKIT_API_KEY: zod_1.z.string().default('devkey'),
    LIVEKIT_API_SECRET: zod_1.z.string().default('secret'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
