import { Router } from "express";
import authRoutes from "./authRoutes.js";
import meetingRoutes from "./meetingRoutes.js";
import invitationRoutes from "./invitationRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import recordingRoutes from "./recordingRoutes.js";
const router = Router();
router.use("/auth", authRoutes);
router.use("/meetings", meetingRoutes);
router.use("/meetings", invitationRoutes);
router.use("/meetings", attendanceRoutes);
router.use("/meetings", recordingRoutes);
var stdin_default = router;
export {
  stdin_default as default
};
