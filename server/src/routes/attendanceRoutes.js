import { Router } from "express";
import { getAttendanceReport, downloadAttendanceCSV } from "../controllers/attendanceController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/:id/attendance", requireAuth, getAttendanceReport);
router.get("/:id/attendance/csv", requireAuth, downloadAttendanceCSV);
var stdin_default = router;
export {
  stdin_default as default
};
