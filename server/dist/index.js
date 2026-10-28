"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_js_1 = require("./app.js");
const db_js_1 = require("./config/db.js");
const env_js_1 = require("./config/env.js");
const socketHandler_js_1 = require("./sockets/socketHandler.js");
const startServer = async () => {
    await (0, db_js_1.connectDB)();
    const app = (0, app_js_1.createApp)();
    const httpServer = http_1.default.createServer(app);
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: [env_js_1.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingTimeout: 30000,
        pingInterval: 10000,
    });
    (0, socketHandler_js_1.registerSocketHandlers)(io);
    const server = httpServer.listen(Number(env_js_1.env.PORT), () => {
        console.log(`===============================================`);
        console.log(`🚀 MeetSpace API & Signaling Server running`);
        console.log(`📍 Port: ${env_js_1.env.PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${env_js_1.env.PORT}/api/docs`);
        console.log(`🌐 Client Origin: ${env_js_1.env.CLIENT_URL}`);
        console.log(`📡 LiveKit Server: ${env_js_1.env.LIVEKIT_URL}`);
        console.log(`===============================================`);
    });
    const handleShutdown = async (signal) => {
        console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
        io.close(() => console.log('Socket.IO connections closed.'));
        server.close(async () => {
            console.log('HTTP server closed.');
            await (0, db_js_1.disconnectDB)();
            process.exit(0);
        });
        // Force exit after 10s if hanging
        setTimeout(() => {
            console.error('Forcing shutdown after timeout.');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
};
startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
