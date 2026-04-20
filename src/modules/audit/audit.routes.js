import express from "express";
import * as auditController from "./audit.controller.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", adminOnly, auditController.getAuditLogsController);

export default router;
