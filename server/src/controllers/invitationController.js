import crypto from "crypto";
import { z } from "zod";
import { Meeting } from "../models/Meeting.js";
import { Invitation } from "../models/Invitation.js";
import { icsService } from "../services/icsService.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(1, "Provide at least one email address")
});
const createInvitations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can invite participants", 403);
    }
    const expiresAt = meeting.scheduledStartTime ? new Date(meeting.scheduledStartTime.getTime() + (meeting.scheduledDuration + 1440) * 60 * 1e3) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    const createdInvitations = [];
    for (const email of emails) {
      const token = crypto.randomBytes(24).toString("hex");
      const inv = await Invitation.findOneAndUpdate(
        { meetingId: meeting._id, inviteeEmail: email.toLowerCase() },
        {
          token,
          status: "pending",
          invitedBy: req.user.id,
          expiresAt
        },
        { upsert: true, new: true }
      );
      createdInvitations.push({ email: inv.inviteeEmail, status: inv.status });
    }
    res.status(200).json({
      success: true,
      message: `Invitations created for ${createdInvitations.length} recipients`,
      invitations: createdInvitations,
      shareableLink: `${env.CLIENT_URL}/meeting/${meeting.meetingCode}`
    });
  } catch (error) {
    next(error);
  }
};
const getInvitations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitations = await Invitation.find({ meetingId: id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      invitations
    });
  } catch (error) {
    next(error);
  }
};
const downloadIcs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id).populate("hostId", "name email");
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    const host = meeting.hostId;
    const icsContent = icsService.generateCalendarEvent(
      meeting,
      host?.name || "MeetSpace Host",
      host?.email || "host@meetspace.dev"
    );
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="meetspace-${meeting.meetingCode}.ics"`);
    res.send(icsContent);
  } catch (error) {
    next(error);
  }
};
export {
  createInvitations,
  downloadIcs,
  getInvitations,
  inviteSchema
};
