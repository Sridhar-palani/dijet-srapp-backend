import express from "express";
import * as invoiceController from "./invoice.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";

const router = express.Router();

router.post("/", invoiceController.createInvoiceController);
router.get("/", invoiceController.getAllInvoicesController);
router.get("/:id", validateObjectId, invoiceController.getInvoiceByIdController);
router.put("/:id", validateObjectId, invoiceController.updateInvoiceController);
router.delete("/:id", validateObjectId, invoiceController.deleteInvoiceController);

export default router;
