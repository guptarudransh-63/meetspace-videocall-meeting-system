"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_js_1 = require("../controllers/attendanceController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/:id/attendance', auth_js_1.requireAuth, attendanceController_js_1.getAttendanceReport);
router.get('/:id/attendance/csv', auth_js_1.requireAuth, attendanceController_js_1.downloadAttendanceCSV);
exports.default = router;
