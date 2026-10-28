import { Router } from "express";
import {
  createMeeting,
  listMeetings,
  getMeetingByCode,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  endMeeting,
  createMeetingSchema,
  updateMeetingSchema,
  joinMeetingSchema
} from "../controllers/meetingController.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { ChatMessage } from "../models/ChatMessage.js";
const router = Router();
router.post("/", requireAuth, validateBody(createMeetingSchema), createMeeting);
router.get("/", requireAuth, listMeetings);
router.get("/:code", optionalAuth, getMeetingByCode);
router.patch("/:id", requireAuth, validateBody(updateMeetingSchema), updateMeeting);
router.delete("/:id", requireAuth, deleteMeeting);
router.post("/:code/join", optionalAuth, validateBody(joinMeetingSchema), joinMeeting);
router.post("/:code/end", requireAuth, endMeeting);
router.get("/:code/messages", optionalAuth, async (req, res, next) => {
  try {
    const { code } = req.params;
    const { Meeting } = await import("../models/Meeting.js");
    const meeting = await Meeting.findOne({ meetingCode: code });
    if (!meeting) {
      res.status(404).json({ success: false, message: "Meeting not found" });
      return;
    }
    const messages = await ChatMessage.find({ meetingId: meeting._id }).sort({ createdAt: 1 }).limit(200);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});
var stdin_default = router;
export {
  stdin_default as default
};
