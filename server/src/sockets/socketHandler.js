import { Meeting } from "../models/Meeting.js";
import { MeetingParticipant } from "../models/MeetingParticipant.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { attendanceService } from "../services/attendanceService.js";
import { livekitService } from "../services/livekitService.js";
const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    const socketState = {};
    socket.on("join-room", async (data) => {
      try {
        const { meetingCode, participantIdentity, displayName, role = "participant", userId, clientInfo } = data;
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }
        if (meeting.status === "ended") {
          socket.emit("error", { message: "Meeting has ended" });
          return;
        }
        socketState.meetingCode = meetingCode;
        socketState.participantIdentity = participantIdentity;
        socketState.displayName = displayName;
        socketState.role = role;
        socketState.userId = userId;
        socketState.inWaitingRoom = false;
        const roomName = `room:${meetingCode}`;
        socket.join(roomName);
        await attendanceService.recordJoin({
          meetingId: meeting._id,
          userId: userId || null,
          displayName,
          participantIdentity,
          socketId: socket.id,
          clientInfo
        });
        socket.to(roomName).emit("participant-joined", {
          participantIdentity,
          displayName,
          role,
          timestamp: /* @__PURE__ */ new Date()
        });
        if (role === "host" || role === "co-host") {
          const waitingParticipants = await MeetingParticipant.find({
            meetingId: meeting._id,
            status: "waiting"
          }).select("displayName userId createdAt");
          socket.emit("waiting-room-list", waitingParticipants);
        }
        console.log(`[Socket] ${displayName} (${participantIdentity}) joined room ${meetingCode}`);
      } catch (err) {
        console.error("[Socket] join-room error:", err);
      }
    });
    socket.on("join-waiting-room", async (data) => {
      try {
        const { meetingCode, displayName, participantIdentity, userId } = data;
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }
        socketState.meetingCode = meetingCode;
        socketState.participantIdentity = participantIdentity;
        socketState.displayName = displayName;
        socketState.userId = userId;
        socketState.inWaitingRoom = true;
        const waitingRoomName = `waiting:${meetingCode}`;
        socket.join(waitingRoomName);
        const participant = await MeetingParticipant.findOneAndUpdate(
          {
            meetingId: meeting._id,
            displayName
          },
          {
            userId: userId || null,
            displayName,
            role: "participant",
            status: "waiting"
          },
          { upsert: true, new: true }
        );
        io.to(`room:${meetingCode}`).emit("participant-waiting", {
          id: participant._id,
          displayName,
          participantIdentity,
          timestamp: /* @__PURE__ */ new Date()
        });
        console.log(`[Socket] ${displayName} entered waiting room for ${meetingCode}`);
      } catch (err) {
        console.error("[Socket] join-waiting-room error:", err);
      }
    });
    socket.on("admit-participant", async (data) => {
      try {
        const { meetingCode, participantIdentity, displayName } = data;
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) return;
        if (socketState.role !== "host" && socketState.role !== "co-host") {
          socket.emit("error", { message: "Only hosts can admit participants" });
          return;
        }
        await MeetingParticipant.updateMany(
          { meetingId: meeting._id, displayName },
          { status: "admitted", admittedAt: /* @__PURE__ */ new Date() }
        );
        const token = await livekitService.generateToken({
          roomName: meeting.meetingCode,
          participantIdentity,
          participantName: displayName,
          isHost: false,
          canPublish: true,
          canSubscribe: true,
          canPublishData: meeting.chatEnabled
        });
        io.to(`waiting:${meetingCode}`).emit("admitted", {
          participantIdentity,
          token,
          meeting: {
            id: meeting._id,
            meetingCode: meeting.meetingCode,
            title: meeting.title,
            chatEnabled: meeting.chatEnabled,
            allowScreenShare: meeting.allowScreenShare,
            allowParticipantUnmute: meeting.allowParticipantUnmute
          }
        });
        io.to(`room:${meetingCode}`).emit("waiting-room-update", {
          admittedIdentity: participantIdentity
        });
        console.log(`[Socket] Host admitted ${displayName} into ${meetingCode}`);
      } catch (err) {
        console.error("[Socket] admit-participant error:", err);
      }
    });
    socket.on("reject-participant", async (data) => {
      try {
        const { meetingCode, participantIdentity, displayName } = data;
        if (socketState.role !== "host" && socketState.role !== "co-host") {
          socket.emit("error", { message: "Only hosts can reject participants" });
          return;
        }
        io.to(`waiting:${meetingCode}`).emit("rejected", {
          participantIdentity,
          message: "The host has denied your request to join the meeting."
        });
      } catch (err) {
        console.error("[Socket] reject-participant error:", err);
      }
    });
    socket.on("send-message", async (data) => {
      try {
        const { meetingCode, message, senderName, senderRole = "participant", senderId } = data;
        if (!message || !message.trim()) return;
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) return;
        if (!meeting.chatEnabled && socketState.role !== "host") {
          socket.emit("error", { message: "Chat is disabled for this meeting" });
          return;
        }
        const chatMsg = await ChatMessage.create({
          meetingId: meeting._id,
          senderId: senderId || null,
          senderName: senderName || socketState.displayName || "Participant",
          senderRole: senderRole || socketState.role || "participant",
          message: message.trim(),
          messageType: "chat"
        });
        io.to(`room:${meetingCode}`).emit("new-message", {
          id: chatMsg._id,
          senderName: chatMsg.senderName,
          senderRole: chatMsg.senderRole,
          message: chatMsg.message,
          messageType: chatMsg.messageType,
          createdAt: chatMsg.createdAt
        });
      } catch (err) {
        console.error("[Socket] send-message error:", err);
      }
    });
    socket.on("raise-hand", (data) => {
      if (!socketState.meetingCode) return;
      io.to(`room:${data.meetingCode || socketState.meetingCode}`).emit("hand-toggled", {
        participantIdentity: socketState.participantIdentity,
        displayName: socketState.displayName,
        raised: data.raised
      });
    });
    socket.on("end-meeting-for-all", async (data) => {
      try {
        if (socketState.role !== "host") {
          socket.emit("error", { message: "Only the host can end the meeting for all" });
          return;
        }
        const meeting = await Meeting.findOne({ meetingCode: data.meetingCode });
        if (meeting) {
          meeting.status = "ended";
          meeting.actualEndTime = /* @__PURE__ */ new Date();
          await meeting.save();
          await attendanceService.reconcileMeetingSessions(meeting._id, meeting.actualEndTime);
          await livekitService.deleteRoom(meeting.meetingCode);
        }
        io.to(`room:${data.meetingCode}`).emit("meeting-ended-by-host", {
          message: "The host has ended the meeting for all participants."
        });
      } catch (err) {
        console.error("[Socket] end-meeting-for-all error:", err);
      }
    });
    socket.on("remove-participant", async (data) => {
      try {
        if (socketState.role !== "host" && socketState.role !== "co-host") {
          socket.emit("error", { message: "Only hosts can remove participants" });
          return;
        }
        io.to(`room:${data.meetingCode}`).emit("participant-removed", {
          participantIdentity: data.participantIdentity
        });
        await livekitService.removeParticipant(data.meetingCode, data.participantIdentity);
      } catch (err) {
        console.error("[Socket] remove-participant error:", err);
      }
    });
    socket.on("disconnect", async () => {
      if (socketState.meetingCode && socketState.participantIdentity && !socketState.inWaitingRoom) {
        const { meetingCode, participantIdentity, displayName } = socketState;
        await attendanceService.recordLeave({
          participantIdentity,
          socketId: socket.id,
          cleanDisconnect: true
        });
        socket.to(`room:${meetingCode}`).emit("participant-left", {
          participantIdentity,
          displayName,
          timestamp: /* @__PURE__ */ new Date()
        });
        console.log(`[Socket] ${displayName} (${participantIdentity}) disconnected from ${meetingCode}`);
      }
    });
  });
};
export {
  registerSocketHandlers
};
