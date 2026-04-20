import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "./auth.controller.js";
import { protect, adminOnly } from "../../middlewares/auth.middleware.js";
import validateObjectId from "../../middlewares/validateObjectId.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/login", loginLimiter, authController.loginController);

// ── Authenticated (any logged-in user) ───────────────────────────────────────
router.use(protect);
router.get("/me", authController.getMeController);
router.post("/change-password", authController.changePasswordController);

// ── Admin only ────────────────────────────────────────────────────────────────
router.post("/users", adminOnly, authController.registerController);                                    // create user
router.get("/users", adminOnly, authController.getAllUsersController);                                  // list all users
router.put("/users/:id", adminOnly, validateObjectId, authController.updateUserController);             // update name/email/role/isActive
router.post("/users/:id/reset-password", adminOnly, validateObjectId, authController.adminResetPasswordController); // reset password
router.patch("/users/:id/deactivate", adminOnly, validateObjectId, authController.deactivateUserController);        // deactivate

export default router;
