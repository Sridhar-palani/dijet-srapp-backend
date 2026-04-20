import * as QuotationController from "./quotation.controller.js";
import express from "express";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", QuotationController.createQuotationController);
router.get("/", QuotationController.getAllQuotationsController);
router.get("/:id", validateObjectId, QuotationController.getQuotationByIdController);
router.put("/:id", validateObjectId, QuotationController.updateQuotationController);
router.delete("/:id", validateObjectId, QuotationController.deleteQuotationController);
router.patch("/:id/approve", validateObjectId, adminOnly, QuotationController.approveQuotationController);

const quotationRoutes = router;
export default quotationRoutes;
