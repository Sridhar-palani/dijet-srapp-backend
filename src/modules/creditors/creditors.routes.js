import express from "express";
import * as creditorsController from "./creditors.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.get("/", creditorsController.getAllCreditorsController);
router.get("/summary", creditorsController.getCreditorsSummaryController);
router.get("/:poId", validateObjectId, creditorsController.getPOPaymentsController);
router.post("/:poId/payment", validateObjectId, creditorsController.recordPaymentController);

export default router;
