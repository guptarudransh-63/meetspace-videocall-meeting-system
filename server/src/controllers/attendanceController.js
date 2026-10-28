import { Meeting } from "../models/Meeting.js";
import { attendanceService } from "../services/attendanceService.js";
import { AppError } from "../middleware/errorHandler.js";
const getAttendanceReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host or admin can view the attendance report", 403);
    }
    const report = await attendanceService.getMeetingAttendanceReport(meeting._id);
    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};
const downloadAttendanceCSV = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      throw new AppError("Meeting not found", 404);
    }
    if (String(meeting.hostId) !== req.user.id && req.user.role !== "admin") {
      throw new AppError("Only the host can export the attendance report", 403);
    }
    const csvData = await attendanceService.generateCSV(meeting._id);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance-${meeting.meetingCode}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
export {
  downloadAttendanceCSV,
  getAttendanceReport
};
