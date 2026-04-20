import express from "express";
import * as cpoController from "./customer_po.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";

const router = express.Router();

router.post("/", cpoController.createCPOController);
router.post("/from-quotation/:quotationId", validateObjectId, cpoController.createFromQuotationController);
router.get("/", cpoController.getAllCPOController);
router.get("/last-price", cpoController.getLastPriceController);
router.get("/:id", validateObjectId, cpoController.getCPOByIdController);
router.get("/:id/delivery-notes", validateObjectId, cpoController.getCPODeliveryNotesController);
router.get("/:id/invoices", validateObjectId, cpoController.getCPOInvoicesController);
router.put("/:id", validateObjectId, cpoController.updateCPOController);
router.delete("/:id", validateObjectId, cpoController.deleteCPOController);

export default router;
