"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        return mongoose_1.default;
    }
    try {
        const conn = await mongoose_1.default.connect(env_js_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true,
        });
        isConnected = true;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        if (env_js_1.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        return null;
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    if (isConnected) {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('MongoDB disconnected successfully');
    }
};
exports.disconnectDB = disconnectDB;
