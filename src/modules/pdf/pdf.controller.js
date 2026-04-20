import * as pdfService from "./pdf.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

const sendPDF = (generatorFn) =>
  asyncHandler(async (req, res) => {
    const { pdfBuffer, name } = await generatorFn(req.params.id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
    res.send(pdfBuffer);
  });

export const generateQuotationController = asyncHandler(async (req, res) => {
  let showDiscount;
  if (req.query.showDiscount === "true") showDiscount = true;
  else if (req.query.showDiscount === "false") showDiscount = false;
  // otherwise undefined = auto-detect from items

  const { pdfBuffer, name } = await pdfService.generateQuotation(req.params.id, { showDiscount });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
  res.send(pdfBuffer);
});

export const generatePurchaseOrderController = sendPDF(pdfService.generatePurchaseOrder);
export const generateDeliveryNoteController = sendPDF(pdfService.generateDeliveryNote);
export const generateInvoiceController = sendPDF(pdfService.generateInvoice);
