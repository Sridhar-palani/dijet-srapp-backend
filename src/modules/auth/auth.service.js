import jwt from "jsonwebtoken";
import User from "./user.model.js";
import AppError from "../../utils/AppError.js";
import config from "../../config/env.js";

const signToken = (id) =>
  jwt.sign({ id }, config.jwtSecret, { expiresIn: "7d" });

export const register = async ({ name, email, password, role }) => {
  if (!name || !email || !password) throw new AppError("Name, email, and password are required", 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("Email already registered", 409);

  const user = await User.create({ name, email, password, role: role || "user" });
  return { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
};

export const login = async ({ email, password }) => {
  if (!email || !password) throw new AppError("Email and password are required", 400);

  const user = await User.findOne({ email, isActive: true }).select("+password");
  if (!user || !(await user.comparePassword(password)))
    throw new AppError("Invalid email or password", 401);

  const token = signToken(user._id);
  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404);

  if (!(await user.comparePassword(currentPassword)))
    throw new AppError("Current password is incorrect", 401);

  user.password = newPassword;
  await user.save();
  return { message: "Password changed successfully" };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

export const getAllUsers = async () => {
  return await User.find().select("-__v").sort({ createdAt: -1 });
};

export const updateUser = async (targetId, requesterId, { name, email, role, isActive }) => {
  const user = await User.findById(targetId);
  if (!user) throw new AppError("User not found", 404);

  // Prevent admin from removing their own admin role or deactivating themselves
  if (targetId === requesterId && (role === "user" || isActive === false))
    throw new AppError("Cannot demote or deactivate your own account", 400);

  if (name !== undefined) user.name = name;
  if (email !== undefined) {
    const conflict = await User.findOne({ email, _id: { $ne: targetId } });
    if (conflict) throw new AppError("Email already in use by another account", 409);
    user.email = email;
  }
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  return { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
};

export const adminResetPassword = async (targetId, newPassword) => {
  if (!newPassword || newPassword.length < 6) throw new AppError("Password must be at least 6 characters", 400);
  const user = await User.findById(targetId);
  if (!user) throw new AppError("User not found", 404);
  user.password = newPassword;
  await user.save();
  return { message: `Password reset for ${user.email}` };
};
