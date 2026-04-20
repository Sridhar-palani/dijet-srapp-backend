import jwt from "jsonwebtoken";
import User from "../modules/auth/user.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import config from "../config/env.js";

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new AppError("Authentication required. Please log in.", 401);

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new AppError("Invalid or expired token. Please log in again.", 401);
  }

  const user = await User.findById(decoded.id).select("name email role isActive");
  if (!user || !user.isActive)
    throw new AppError("User no longer exists or has been deactivated.", 401);

  req.user = user;
  next();
});

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    throw new AppError("Admin access required.", 403);
  next();
};
