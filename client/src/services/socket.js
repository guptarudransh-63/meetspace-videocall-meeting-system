import { io } from "socket.io-client";
let socket = null;
const getSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1e3,
      transports: ["websocket", "polling"]
    });
    socket.on("connect", () => {
      console.log("[Socket] Connected to signaling server, id:", socket?.id);
    });
    socket.on("connect_error", (error) => {
      console.warn("[Socket] Connection error:", error.message);
    });
    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected from signaling server:", reason);
    });
  }
  return socket;
};
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
export {
  disconnectSocket,
  getSocket
};
