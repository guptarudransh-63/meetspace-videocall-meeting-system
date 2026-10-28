import { Router } from "express";
import { getRecordings, startRecording, stopRecording } from "../controllers/recordingController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/:id/recordings", requireAuth, getRecordings);
router.post("/:id/recordings/start", requireAuth, startRecording);
router.post("/:id/recordings/stop", requireAuth, stopRecording);
var stdin_default = router;
export {
  stdin_default as default
};
