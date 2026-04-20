import * as ExportService from "./export.service.js";
import asyncHandler from "../../utils/asyncHandler.js";

const sendExcel = async (res, workbook, filename) => {
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

export const exportInvoicesController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportInvoices();
  await sendExcel(res, wb, "invoices");
});

export const exportPurchaseOrdersController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportPurchaseOrders();
  await sendExcel(res, wb, "purchase-orders");
});

export const exportDeliveryNotesController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportDeliveryNotes();
  await sendExcel(res, wb, "delivery-notes");
});

export const exportExpensesController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportExpenses(req.query);
  await sendExcel(res, wb, "expenses");
});

export const exportStockController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportStock();
  await sendExcel(res, wb, "stock");
});

export const exportDebtorsController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportDebtors();
  await sendExcel(res, wb, "debtors");
});

export const exportInvestmentsController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportInvestments(req.query);
  await sendExcel(res, wb, "investments");
});

export const exportCustomerPosController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportCustomerPos();
  await sendExcel(res, wb, "customer-pos");
});

export const exportQuotationsController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportQuotations();
  await sendExcel(res, wb, "quotations");
});

export const exportGRNsController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportGRNs();
  await sendExcel(res, wb, "grns");
});

export const exportCreditorsController = asyncHandler(async (req, res) => {
  const wb = await ExportService.exportCreditors();
  await sendExcel(res, wb, "creditors");
});
