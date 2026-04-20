import express from "express";
import * as pdfController from "./pdf.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";

const router = express.Router();

router.get("/quotation/:id", validateObjectId, pdfController.generateQuotationController);
router.get("/purchase-order/:id", validateObjectId, pdfController.generatePurchaseOrderController);
router.get("/delivery-note/:id", validateObjectId, pdfController.generateDeliveryNoteController);
router.get("/invoice/:id", validateObjectId, pdfController.generateInvoiceController);

export default router;
