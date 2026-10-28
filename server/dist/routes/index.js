"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const meetingRoutes_js_1 = __importDefault(require("./meetingRoutes.js"));
const invitationRoutes_js_1 = __importDefault(require("./invitationRoutes.js"));
const attendanceRoutes_js_1 = __importDefault(require("./attendanceRoutes.js"));
const recordingRoutes_js_1 = __importDefault(require("./recordingRoutes.js"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_js_1.default);
router.use('/meetings', meetingRoutes_js_1.default);
router.use('/meetings', invitationRoutes_js_1.default);
router.use('/meetings', attendanceRoutes_js_1.default);
router.use('/meetings', recordingRoutes_js_1.default);
exports.default = router;
