import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createApp } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { registerSocketHandlers } from "./sockets/socketHandler.js";
const startServer = async () => {
  await connectDB();
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
      credentials: true,
      methods: ["GET", "POST"]
    },
    pingTimeout: 3e4,
    pingInterval: 1e4
  });
  registerSocketHandlers(io);
  const server = httpServer.listen(Number(env.PORT), () => {
    console.log(`===============================================`);
    console.log(`\u{1F680} MeetSpace API & Signaling Server running`);
    console.log(`\u{1F4CD} Port: ${env.PORT}`);
    console.log(`\u{1F4DA} Swagger Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`\u{1F310} Client Origin: ${env.CLIENT_URL}`);
    console.log(`\u{1F4E1} LiveKit Server: ${env.LIVEKIT_URL}`);
    console.log(`===============================================`);
  });
  const handleShutdown = async (signal) => {
    console.log(`
Received ${signal}. Starting graceful shutdown...`);
    io.close(() => console.log("Socket.IO connections closed."));
    server.close(async () => {
      console.log("HTTP server closed.");
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Forcing shutdown after timeout.");
      process.exit(1);
    }, 1e4);
  };
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
};
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
