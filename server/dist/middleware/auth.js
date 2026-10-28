"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.optionalAuth = exports.requireAuth = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const User_js_1 = require("../models/User.js");
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: String(user._id),
        email: user.email,
        role: user.role,
    }, env_js_1.env.JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const requireAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
        const user = await User_js_1.User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            res.status(401).json({ success: false, message: 'User session invalid or user not found' });
            return;
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            timezone: user.timezone,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = async (req, _res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.JWT_SECRET);
            const user = await User_js_1.User.findById(decoded.id).select('-passwordHash');
            if (user) {
                req.user = {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    timezone: user.timezone,
                };
            }
        }
    }
    catch {
        // optional token invalid, ignore and proceed as guest
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
