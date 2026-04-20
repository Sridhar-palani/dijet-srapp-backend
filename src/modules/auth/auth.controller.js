import * as AuthService from "./auth.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";

export const registerController = asyncHandler(async (req, res) => {
  const user = await AuthService.register(req.body);
  sendResponse(res, 201, user, "User created successfully");
});

export const loginController = asyncHandler(async (req, res) => {
  const data = await AuthService.login(req.body);
  sendResponse(res, 200, data, "Login successful");
});

export const getMeController = asyncHandler(async (req, res) => {
  const user = await AuthService.getMe(req.user._id);
  sendResponse(res, 200, user);
});

export const changePasswordController = asyncHandler(async (req, res) => {
  const data = await AuthService.changePassword(req.user._id, req.body);
  sendResponse(res, 200, data);
});

// Admin controllers
export const getAllUsersController = asyncHandler(async (req, res) => {
  const users = await AuthService.getAllUsers();
  sendResponse(res, 200, users);
});

export const updateUserController = asyncHandler(async (req, res) => {
  const user = await AuthService.updateUser(req.params.id, req.user._id.toString(), req.body);
  sendResponse(res, 200, user, "User updated successfully");
});

export const adminResetPasswordController = asyncHandler(async (req, res) => {
  const result = await AuthService.adminResetPassword(req.params.id, req.body.newPassword);
  sendResponse(res, 200, result);
});

export const deactivateUserController = asyncHandler(async (req, res) => {
  await AuthService.updateUser(req.params.id, req.user._id.toString(), { isActive: false });
  sendResponse(res, 200, null, "User deactivated successfully");
});
