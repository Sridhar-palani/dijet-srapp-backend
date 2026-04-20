import Quotation from "../quotation/quotation.model.js";
import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import DeliveryNote from "../delivery_note/delivery_note.model.js";
import Invoice from "../invoice/invoice.model.js";
import generateQuotationTemplate from "../quotation/templates/quotation.template.js";
import generatePurchaseOrderPDF from "../purchase_order/templates/purchase_order.template.js";
import generateDeliveryNotePDF from "../delivery_note/templates/delivery_note.template.js";
import generateInvoicePDF from "../invoice/templates/invoice.template.js";
import AppError from "../../utils/AppError.js";

// Sanitize strings for safe use as filenames
const sanitizeFilename = (str) => str.replace(/[^a-z0-9-_]/gi, "_");

export const generateQuotation = async (id, { showDiscount } = {}) => {
  const quotation = await Quotation.findById(id).populate("customer").populate("items.itemData");
  if (!quotation) throw new AppError("Quotation not found", 404);
  const pdfBuffer = await generateQuotationTemplate(quotation, { showDiscount });
  const name = sanitizeFilename(`${quotation.quotationNumber}-${quotation.customer.name}`);
  return { pdfBuffer, name };
};

export const generatePurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findById(id).populate("vendor").populate("items.itemId");
  if (!po) throw new AppError("Purchase Order not found", 404);
  const pdfBuffer = await generatePurchaseOrderPDF(po);
  const name = sanitizeFilename(po.poNumber);
  return { pdfBuffer, name };
};

export const generateDeliveryNote = async (id) => {
  const dn = await DeliveryNote.findById(id)
    .populate("customer")
    .populate("cpoId")
    .populate("poId")
    .populate("quotationId")
    .populate("items.itemId");
  if (!dn) throw new AppError("Delivery Note not found", 404);
  const pdfBuffer = await generateDeliveryNotePDF(dn);
  const name = sanitizeFilename(`${dn.dnNumber}-${dn.customer.name}`);
  return { pdfBuffer, name };
};

export const generateInvoice = async (id) => {
  const invoice = await Invoice.findById(id)
    .populate("customer")
    .populate("deliveryNoteId")
    .populate("items.itemId");
  if (!invoice) throw new AppError("Invoice not found", 404);
  const pdfBuffer = await generateInvoicePDF(invoice);
  const name = sanitizeFilename(`${invoice.invoiceNumber}-${invoice.customer.name}`);
  return { pdfBuffer, name };
};
