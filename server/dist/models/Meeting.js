"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meeting = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MeetingSchema = new mongoose_1.Schema({
    meetingCode: { type: String, required: true, unique: true, uppercase: false, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    hostId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledStartTime: { type: Date },
    scheduledDuration: { type: Number, default: 30 },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled'],
        default: 'scheduled',
        index: true,
    },
    passcode: { type: String, default: null },
    isWaitingRoomEnabled: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 100 },
    isLocked: { type: Boolean, default: false },
    chatEnabled: { type: Boolean, default: true },
    allowScreenShare: { type: Boolean, default: true },
    allowParticipantUnmute: { type: Boolean, default: true },
}, {
    timestamps: true,
});
MeetingSchema.index({ hostId: 1, createdAt: -1 });
MeetingSchema.index({ scheduledStartTime: 1, status: 1 });
exports.Meeting = mongoose_1.default.model('Meeting', MeetingSchema);
