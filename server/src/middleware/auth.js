import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
const generateToken = (user) => {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      res.status(401).json({ success: false, message: "User session invalid or user not found" });
      return;
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      timezone: user.timezone
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
};
const optionalAuth = async (req, _res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          timezone: user.timezone
        };
      }
    }
  } catch {
  }
  next();
};
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: "Access denied: insufficient permissions" });
      return;
    }
    next();
  };
};
export {
  generateToken,
  optionalAuth,
  requireAuth,
  requireRole
};
