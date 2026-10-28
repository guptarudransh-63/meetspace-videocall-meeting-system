"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getMe = exports.logout = exports.login = exports.register = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const User_js_1 = require("../models/User.js");
const auth_js_1 = require("../middleware/auth.js");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
const env_js_1 = require("../config/env.js");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    timezone: zod_1.z.string().optional().default('UTC'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    timezone: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
});
const setAuthCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: env_js_1.env.NODE_ENV === 'production',
        sameSite: env_js_1.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};
const register = async (req, res, next) => {
    try {
        const { name, email, password, timezone } = req.body;
        const existingUser = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new errorHandler_js_1.AppError('An account with this email already exists', 409);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_js_1.User.create({
            name,
            email: email.toLowerCase(),
            passwordHash,
            timezone: timezone || 'UTC',
            role: 'user',
        });
        const token = (0, auth_js_1.generateToken)(user);
        setAuthCookie(res, token);
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw new errorHandler_js_1.AppError('Invalid email or password', 401);
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new errorHandler_js_1.AppError('Invalid email or password', 401);
        }
        const token = (0, auth_js_1.generateToken)(user);
        setAuthCookie(res, token);
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: env_js_1.env.NODE_ENV === 'production',
        sameSite: env_js_1.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        const user = await User_js_1.User.findById(req.user?.id);
        if (!user) {
            throw new errorHandler_js_1.AppError('User not found', 404);
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                role: user.role,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res, next) => {
    try {
        const user = await User_js_1.User.findById(req.user?.id);
        if (!user) {
            throw new errorHandler_js_1.AppError('User not found', 404);
        }
        const { name, timezone, avatarUrl } = req.body;
        if (name)
            user.name = name;
        if (timezone)
            user.timezone = timezone;
        if (avatarUrl !== undefined)
            user.avatarUrl = avatarUrl;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                timezone: user.timezone,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        const user = await User_js_1.User.findById(req.user?.id);
        if (!user) {
            throw new errorHandler_js_1.AppError('User not found', 404);
        }
        const { currentPassword, newPassword } = req.body;
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new errorHandler_js_1.AppError('Current password is incorrect', 400);
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
