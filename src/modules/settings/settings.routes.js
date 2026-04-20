import express from "express";
import * as SettingsController from "./settings.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", SettingsController.getSettingsController);           // any auth'd user can read
router.put("/opening-balance", adminOnly, SettingsController.updateOpeningBalanceController); // admin only

export default router;
