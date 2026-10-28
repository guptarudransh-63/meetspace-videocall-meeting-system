"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const meetingController_js_1 = require("../controllers/meetingController.js");
const auth_js_1 = require("../middleware/auth.js");
const validate_js_1 = require("../middleware/validate.js");
const ChatMessage_js_1 = require("../models/ChatMessage.js");
const router = (0, express_1.Router)();
// Create meeting (Host must be authenticated)
router.post('/', auth_js_1.requireAuth, (0, validate_js_1.validateBody)(meetingController_js_1.createMeetingSchema), meetingController_js_1.createMeeting);
// List user meetings
router.get('/', auth_js_1.requireAuth, meetingController_js_1.listMeetings);
// Get meeting by code (Public / pre-join details)
router.get('/:code', auth_js_1.optionalAuth, meetingController_js_1.getMeetingByCode);
// Update meeting settings (Host only)
router.patch('/:id', auth_js_1.requireAuth, (0, validate_js_1.validateBody)(meetingController_js_1.updateMeetingSchema), meetingController_js_1.updateMeeting);
// Cancel meeting (Host only)
router.delete('/:id', auth_js_1.requireAuth, meetingController_js_1.deleteMeeting);
// Join meeting (Supports authenticated users or guests with optional token)
router.post('/:code/join', auth_js_1.optionalAuth, (0, validate_js_1.validateBody)(meetingController_js_1.joinMeetingSchema), meetingController_js_1.joinMeeting);
// End meeting for all participants (Host only)
router.post('/:code/end', auth_js_1.requireAuth, meetingController_js_1.endMeeting);
// Historical chat messages for meeting
router.get('/:code/messages', auth_js_1.optionalAuth, async (req, res, next) => {
    try {
        const { code } = req.params;
        const { Meeting } = await import('../models/Meeting.js');
        const meeting = await Meeting.findOne({ meetingCode: code });
        if (!meeting) {
            res.status(404).json({ success: false, message: 'Meeting not found' });
            return;
        }
        const messages = await ChatMessage_js_1.ChatMessage.find({ meetingId: meeting._id })
            .sort({ createdAt: 1 })
            .limit(200);
        res.status(200).json({ success: true, messages });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
