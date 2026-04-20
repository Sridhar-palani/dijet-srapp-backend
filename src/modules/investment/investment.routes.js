import express from "express";
import * as investmentController from "./investment.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.get("/summary", investmentController.getInvestmentSummaryController);
router.get("/", investmentController.getAllInvestmentsController);
router.get("/:id", validateObjectId, investmentController.getInvestmentByIdController);
router.post("/", investmentController.createInvestmentController);
router.put("/:id", validateObjectId, investmentController.updateInvestmentController);
router.delete("/:id", validateObjectId, investmentController.deleteInvestmentController);

export default router;
