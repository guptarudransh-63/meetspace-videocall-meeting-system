import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { env } from "../config/env.js";
class LiveKitService {
  roomService;
  constructor() {
    this.roomService = new RoomServiceClient(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
  }
  /**
   * Generates a secure, short-lived JWT for LiveKit SFU access
   */
  async generateToken(options) {
    const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
      identity: options.participantIdentity,
      name: options.participantName,
      ttl: "4h"
    });
    at.addGrant({
      roomJoin: true,
      room: options.roomName,
      canPublish: options.canPublish ?? true,
      canSubscribe: options.canSubscribe ?? true,
      canPublishData: options.canPublishData ?? true,
      roomAdmin: options.isHost ?? false,
      roomRecord: options.isHost ?? false
    });
    return at.toJwt();
  }
  /**
   * List participants in an active LiveKit room
   */
  async listParticipants(roomName) {
    try {
      return await this.roomService.listParticipants(roomName);
    } catch (error) {
      console.warn(`[LiveKitService] Could not list participants for room ${roomName}:`, error);
      return [];
    }
  }
  /**
   * Remove a participant from the LiveKit room
   */
  async removeParticipant(roomName, identity) {
    try {
      await this.roomService.removeParticipant(roomName, identity);
      return true;
    } catch (error) {
      console.warn(`[LiveKitService] Could not remove participant ${identity} from ${roomName}:`, error);
      return false;
    }
  }
  /**
   * Mute a participant's published track
   */
  async muteTrack(roomName, identity, trackSid, muted) {
    try {
      await this.roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
      return true;
    } catch (error) {
      console.warn(`[LiveKitService] Could not mute track ${trackSid}:`, error);
      return false;
    }
  }
  /**
   * End/delete a room on LiveKit SFU
   */
  async deleteRoom(roomName) {
    try {
      await this.roomService.deleteRoom(roomName);
      return true;
    } catch (error) {
      console.warn(`[LiveKitService] Could not delete room ${roomName}:`, error);
      return false;
    }
  }
}
const livekitService = new LiveKitService();
export {
  LiveKitService,
  livekitService
};
