import ExcelJS from "exceljs";
import Invoice from "../invoice/invoice.model.js";
import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import DeliveryNote from "../delivery_note/delivery_note.model.js";
import CustomerPO from "../customer_po/customer_po.model.js";
import Quotation from "../quotation/quotation.model.js";
import GRN from "../grn/grn.model.js";
import Expense from "../expense/expense.model.js";
import Item from "../item/item.model.js";
import Investment from "../investment/investment.model.js";

// ── FY helpers ─────────────────────────────────────────────────────────────
const getFYLabel = (date) => {
  if (!date) return "Unknown";
  const d = new Date(date);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `FY ${String(fyStart).slice(2)}-${String(fyEnd).slice(2)}`;
};

// Groups records by FY label (newest FY first). Returns Map<label, records[]>.
const groupByFY = (records, dateField) => {
  const groups = new Map();
  for (const rec of records) {
    const label = getFYLabel(rec[dateField]);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(rec);
  }
  return new Map([...groups.entries()].sort((a, b) => b[0].localeCompare(a[0])));
};

// ── Workbook builders ──────────────────────────────────────────────────────
const applyHeaderStyle = (ws) => {
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
};

// Multi-sheet workbook — one sheet per FY. rowGroups: Map<fyLabel, rows[]>
const buildMultiSheetWorkbook = (columns, rowGroups) => {
  const wb = new ExcelJS.Workbook();
  if (rowGroups.size === 0) {
    wb.addWorksheet("No Data");
    return wb;
  }
  for (const [label, rows] of rowGroups) {
    const ws = wb.addWorksheet(label);
    ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }));
    applyHeaderStyle(ws);
    rows.forEach((r) => ws.addRow(r));
  }
  return wb;
};

// Single-sheet workbook (for point-in-time snapshots like stock/debtors/creditors)
const buildWorkbook = (sheetName, columns, rows) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 18 }));
  applyHeaderStyle(ws);
  rows.forEach((r) => ws.addRow(r));
  return wb;
};

// ── Invoices (document-wise, multi-sheet by FY) ────────────────────────────
export const exportInvoices = async () => {
  const invoices = await Invoice.find()
    .populate("customer", "name")
    .populate("deliveryNoteId", "dnNumber")
    .sort({ docDate: -1 });

  const columns = [
    { header: "Invoice No", key: "invoiceNumber", width: 20 },
    { header: "Date", key: "invoiceDate", width: 16 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "DN No", key: "dnNumber", width: 18 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Total Qty", key: "totalQty", width: 12 },
    { header: "Taxable Amt (₹)", key: "totalBeforeTax", width: 18 },
    { header: "SGST (₹)", key: "sgst", width: 14 },
    { header: "CGST (₹)", key: "cgst", width: 14 },
    { header: "IGST (₹)", key: "igst", width: 14 },
    { header: "Total Amt (₹)", key: "totalAfterTax", width: 18 },
    { header: "Amount Paid (₹)", key: "paid", width: 16 },
    { header: "Balance Due (₹)", key: "balance", width: 16 },
    { header: "Status", key: "status", width: 18 },
    { header: "Due Date", key: "dueDate", width: 16 },
    { header: "Payment Terms", key: "paymentTerms", width: 20 },
  ];

  const fyGroups = groupByFY(invoices, "docDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((inv) => {
      const t = inv.taxSummary || {};
      const totalAfterTax = t.totalAfterTax || 0;
      return {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate || "",
        customer: inv.customer?.name || "",
        dnNumber: inv.deliveryNoteId?.dnNumber || "",
        itemCount: inv.items.length,
        totalQty: inv.items.reduce((s, i) => s + (i.quantity || 0), 0),
        totalBeforeTax: t.totalBeforeTax || 0,
        sgst: t.totalSGST || 0,
        cgst: t.totalCGST || 0,
        igst: t.totalIGST || 0,
        totalAfterTax,
        paid: inv.amountPaid || 0,
        balance: parseFloat((totalAfterTax - (inv.amountPaid || 0)).toFixed(2)),
        status: inv.status,
        dueDate: inv.dueDate || "",
        paymentTerms: inv.paymentTerms || "",
      };
    }));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Purchase Orders (document-wise, multi-sheet by FY) ────────────────────
export const exportPurchaseOrders = async () => {
  const pos = await PurchaseOrder.find().populate("vendor", "name").sort({ poDate: -1 });

  const columns = [
    { header: "PO Number", key: "poNumber", width: 20 },
    { header: "Date", key: "date", width: 16 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Ordered Qty", key: "orderedQty", width: 14 },
    { header: "Received Qty", key: "receivedQty", width: 14 },
    { header: "Pending Qty", key: "pendingQty", width: 14 },
    { header: "Total Amount (₹)", key: "totalAmount", width: 18 },
    { header: "Amount Paid (₹)", key: "amountPaid", width: 16 },
    { header: "Balance Due (₹)", key: "balance", width: 16 },
    { header: "Status", key: "status", width: 18 },
    { header: "Payment Terms", key: "paymentTerms", width: 20 },
    { header: "Due Date", key: "dueDate", width: 16 },
  ];

  const fyGroups = groupByFY(pos, "poDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((po) => {
      const orderedQty  = po.items.reduce((s, i) => s + (i.quantity || 0), 0);
      const receivedQty = po.items.reduce((s, i) => s + (i.receivedQty || 0), 0);
      return {
        poNumber: po.poNumber,
        date: po.poDate?.toISOString().split("T")[0] || "",
        vendor: po.vendor?.name || "",
        itemCount: po.items.length,
        orderedQty,
        receivedQty,
        pendingQty: orderedQty - receivedQty,
        totalAmount: po.totalAmount,
        amountPaid: po.amountPaid || 0,
        balance: parseFloat((po.totalAmount - (po.amountPaid || 0)).toFixed(2)),
        status: po.status,
        paymentTerms: po.paymentTerms || "",
        dueDate: po.dueDate || "",
      };
    }));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Delivery Notes (document-wise, multi-sheet by FY) ─────────────────────
export const exportDeliveryNotes = async () => {
  const dns = await DeliveryNote.find()
    .populate("customer", "name")
    .populate("cpoId", "cpoNumber")
    .sort({ docDate: -1 });

  const columns = [
    { header: "DN Number", key: "dnNumber", width: 20 },
    { header: "Date", key: "date", width: 16 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "CPO No", key: "cpoNumber", width: 22 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Total Delivered Qty", key: "deliveredQty", width: 20 },
    { header: "Total Invoiced Qty", key: "invoicedQty", width: 18 },
    { header: "Pending Inv Qty", key: "pendingQty", width: 16 },
    { header: "Status", key: "status", width: 18 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  const fyGroups = groupByFY(dns, "docDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((dn) => {
      const deliveredQty = dn.items.reduce((s, i) => s + (i.deliveredQty || 0), 0);
      const invoicedQty  = dn.items.reduce((s, i) => s + (i.invoicedQty || 0), 0);
      return {
        dnNumber: dn.dnNumber,
        date: dn.docDate?.toISOString().split("T")[0] || dn.deliveryDate || "",
        customer: dn.customer?.name || "",
        cpoNumber: dn.cpoId?.cpoNumber || "",
        itemCount: dn.items.length,
        deliveredQty,
        invoicedQty,
        pendingQty: deliveredQty - invoicedQty,
        status: dn.status,
        remarks: dn.remarks || "",
      };
    }));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Expenses (multi-sheet by FY) ───────────────────────────────────────────
export const exportExpenses = async ({ category } = {}) => {
  const filter = {};
  if (category) filter.category = category;
  const expenses = await Expense.find(filter).sort({ docDate: -1 });

  const columns = [
    { header: "Date", key: "date", width: 16 },
    { header: "Category", key: "category", width: 18 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount (₹)", key: "amount", width: 16 },
    { header: "Paid To", key: "paidTo", width: 22 },
    { header: "Reference No", key: "referenceNo", width: 20 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  const fyGroups = groupByFY(expenses, "docDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((e) => ({
      date: e.expenseDate,
      category: e.category,
      description: e.description,
      amount: e.amount,
      paidTo: e.paidTo || "",
      referenceNo: e.referenceNo || "",
      remarks: e.remarks || "",
    })));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Stock (single sheet — current snapshot) ────────────────────────────────
export const exportStock = async () => {
  const items = await Item.find().sort({ name: 1 });

  const itemIds = items.map((i) => i._id);
  const pendingAgg = await PurchaseOrder.aggregate([
    { $match: { status: { $in: ["Open", "Partially Received"] } } },
    { $unwind: "$items" },
    { $match: { "items.itemId": { $in: itemIds } } },
    {
      $group: {
        _id: "$items.itemId",
        pendingStock: {
          $sum: { $max: [0, { $subtract: ["$items.quantity", { $ifNull: ["$items.receivedQty", 0] }] }] },
        },
      },
    },
  ]);
  const pendingMap = Object.fromEntries(pendingAgg.map((d) => [d._id.toString(), d.pendingStock]));

  const columns = [
    { header: "Item Name", key: "name", width: 30 },
    { header: "Make / Brand", key: "make", width: 22 },
    { header: "HSN Code", key: "hsnCode", width: 16 },
    { header: "Item Type", key: "itemType", width: 24 },
    { header: "Application", key: "application", width: 28 },
    { header: "Stock (Qty)", key: "stock", width: 14 },
    { header: "Pending Stock (Qty)", key: "pendingStock", width: 20 },
    { header: "List Price (₹)", key: "listPrice", width: 16 },
    { header: "Max Discount %", key: "maxDiscountPercent", width: 16 },
    { header: "Note", key: "note", width: 28 },
    { header: "Status", key: "status", width: 16 },
  ];

  const rows = items.map((item) => ({
    name: item.name,
    make: item.make || "",
    hsnCode: item.hsnCode || "",
    itemType: item.itemType || "",
    application: item.application || "",
    stock: item.stock || 0,
    pendingStock: pendingMap[item._id.toString()] || 0,
    listPrice: item.listPrice || 0,
    maxDiscountPercent: item.maxDiscountPercent ?? "",
    note: item.note || "",
    status: item.status,
  }));

  return buildWorkbook("Stock", columns, rows);
};

// ── Investments (multi-sheet by FY of purchase date) ──────────────────────
export const exportInvestments = async ({ category } = {}) => {
  const filter = {};
  if (category) filter.category = category;
  const investments = await Investment.find(filter).sort({ purchaseDate: -1 });

  const columns = [
    { header: "Name", key: "name", width: 30 },
    { header: "Category", key: "category", width: 22 },
    { header: "Purchase Date", key: "purchaseDate", width: 18 },
    { header: "Amount (₹)", key: "amount", width: 16 },
    { header: "Depreciation %", key: "depreciationRate", width: 18 },
    { header: "Vendor", key: "vendor", width: 22 },
    { header: "Status", key: "status", width: 18 },
    { header: "Reference No", key: "referenceNo", width: 20 },
    { header: "Description", key: "description", width: 30 },
  ];

  const fyGroups = groupByFY(investments, "purchaseDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((inv) => ({
      name: inv.name,
      category: inv.category,
      purchaseDate: inv.purchaseDate,
      amount: inv.amount,
      depreciationRate: inv.depreciationRate || 0,
      vendor: inv.vendor || "",
      status: inv.status,
      referenceNo: inv.referenceNo || "",
      description: inv.description || "",
    })));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Customer POs (document-wise, multi-sheet by FY) ───────────────────────
export const exportCustomerPos = async () => {
  const cpos = await CustomerPO.find().populate("customer", "name").sort({ cpoDate: -1 });

  const columns = [
    { header: "CPO No", key: "cpoNumber", width: 22 },
    { header: "Date", key: "date", width: 16 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Total Value (₹)", key: "totalValue", width: 18 },
    { header: "Ordered Qty", key: "orderedQty", width: 14 },
    { header: "Delivered Qty", key: "deliveredQty", width: 15 },
    { header: "Invoiced Qty", key: "invoicedQty", width: 14 },
    { header: "Pending Del Qty", key: "pendingDelQty", width: 16 },
    { header: "Pending Inv Qty", key: "pendingInvQty", width: 16 },
    { header: "Status", key: "status", width: 18 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  const fyGroups = groupByFY(cpos, "cpoDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((cpo) => {
      const orderedQty   = cpo.items.reduce((s, i) => s + (i.orderedQty || 0), 0);
      const deliveredQty = cpo.items.reduce((s, i) => s + (i.deliveredQty || 0), 0);
      const invoicedQty  = cpo.items.reduce((s, i) => s + (i.invoicedQty || 0), 0);
      const totalValue   = parseFloat(cpo.items.reduce((s, i) => s + (i.unitPrice || 0) * (i.orderedQty || 0), 0).toFixed(2));
      return {
        cpoNumber: cpo.cpoNumber,
        date: cpo.cpoDate?.toISOString().split("T")[0] || "",
        customer: cpo.customer?.name || "",
        itemCount: cpo.items.length,
        totalValue,
        orderedQty,
        deliveredQty,
        invoicedQty,
        pendingDelQty: orderedQty - deliveredQty,
        pendingInvQty: deliveredQty - invoicedQty,
        status: cpo.status,
        remarks: cpo.remarks || "",
      };
    }));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Quotations (document-wise, multi-sheet by FY) ─────────────────────────
export const exportQuotations = async () => {
  const quotations = await Quotation.find()
    .populate("customer", "name")
    .sort({ docDate: -1 });

  const columns = [
    { header: "Quotation No", key: "quotationNumber", width: 20 },
    { header: "Date", key: "date", width: 16 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Total Qty", key: "totalQty", width: 12 },
    { header: "Gross Total (₹)", key: "grosstotal", width: 18 },
    { header: "Valid Until", key: "validuntil", width: 16 },
    { header: "Payment Terms", key: "paymentTerms", width: 20 },
    { header: "Status", key: "status", width: 18 },
    { header: "Enquiry Details", key: "enquiryDetails", width: 30 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  const fyGroups = groupByFY(quotations, "docDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((q) => ({
      quotationNumber: q.quotationNumber,
      date: q.date || "",
      customer: q.customer?.name || "",
      itemCount: q.items.length,
      totalQty: q.items.reduce((s, i) => s + (i.quantity || 0), 0),
      grosstotal: q.grosstotal || 0,
      validuntil: q.validuntil || "",
      paymentTerms: q.paymentTerms || "",
      status: q.status,
      enquiryDetails: q.enquiryDetails || "",
      remarks: q.remarks || "",
    })));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── GRNs (document-wise, multi-sheet by FY) ───────────────────────────────
export const exportGRNs = async () => {
  const grns = await GRN.find()
    .populate({ path: "poId", select: "poNumber vendor", populate: { path: "vendor", select: "name" } })
    .sort({ docDate: -1 });

  const columns = [
    { header: "GRN No", key: "grnNumber", width: 20 },
    { header: "Date", key: "date", width: 16 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "PO No", key: "poNumber", width: 20 },
    { header: "Items Count", key: "itemCount", width: 14 },
    { header: "Total Received Qty", key: "totalReceivedQty", width: 20 },
    { header: "Vendor Invoice No", key: "vendorInvoiceNo", width: 22 },
    { header: "Vendor Invoice Date", key: "vendorInvoiceDate", width: 20 },
    { header: "Remarks", key: "remarks", width: 25 },
  ];

  const fyGroups = groupByFY(grns, "docDate");
  const rowGroups = new Map();
  for (const [label, recs] of fyGroups) {
    rowGroups.set(label, recs.map((grn) => ({
      grnNumber: grn.grnNumber,
      date: grn.docDate?.toISOString().split("T")[0] || grn.receivedDate || "",
      vendor: grn.poId?.vendor?.name || "",
      poNumber: grn.poId?.poNumber || "",
      itemCount: grn.items.length,
      totalReceivedQty: grn.items.reduce((s, i) => s + (i.receivedQty || 0), 0),
      vendorInvoiceNo: grn.vendorInvoiceNo || "",
      vendorInvoiceDate: grn.vendorInvoiceDate || "",
      remarks: grn.remarks || "",
    })));
  }
  return buildMultiSheetWorkbook(columns, rowGroups);
};

// ── Creditors (outstanding POs — single sheet snapshot) ───────────────────
export const exportCreditors = async () => {
  const pos = await PurchaseOrder.find({
    status: { $ne: "Cancelled" },
    $expr: { $lt: ["$amountPaid", "$totalAmount"] },
  }).populate("vendor", "name").sort({ poDate: -1 });

  const columns = [
    { header: "PO No", key: "poNumber", width: 20 },
    { header: "Vendor", key: "vendor", width: 25 },
    { header: "Total Amount (₹)", key: "totalAmount", width: 18 },
    { header: "Amount Paid (₹)", key: "amountPaid", width: 18 },
    { header: "Balance Due (₹)", key: "balanceDue", width: 18 },
    { header: "Due Date", key: "dueDate", width: 16 },
    { header: "Status", key: "status", width: 18 },
  ];

  const rows = pos.map((po) => ({
    poNumber: po.poNumber,
    vendor: po.vendor?.name || "",
    totalAmount: po.totalAmount,
    amountPaid: po.amountPaid || 0,
    balanceDue: parseFloat((po.totalAmount - (po.amountPaid || 0)).toFixed(2)),
    dueDate: po.dueDate || "",
    status: po.status,
  }));

  return buildWorkbook("Creditors", columns, rows);
};

// ── Debtors (outstanding invoices — single sheet snapshot) ────────────────
export const exportDebtors = async () => {
  const invoices = await Invoice.find({
    status: { $in: ["Draft", "Sent", "Partially Paid", "Overdue"] },
  }).populate("customer", "name").sort({ docDate: -1 });

  const columns = [
    { header: "Invoice No", key: "invoiceNumber", width: 20 },
    { header: "Customer", key: "customer", width: 25 },
    { header: "Invoice Date", key: "invoiceDate", width: 16 },
    { header: "Due Date", key: "dueDate", width: 16 },
    { header: "Total Amount", key: "total", width: 18 },
    { header: "Amount Paid", key: "paid", width: 18 },
    { header: "Balance Due", key: "balance", width: 18 },
    { header: "Days Overdue", key: "daysOverdue", width: 16 },
    { header: "Status", key: "status", width: 18 },
  ];

  const now = new Date();
  const rows = invoices.map((inv) => {
    const total = inv.taxSummary?.totalAfterTax || 0;
    const daysOverdue = inv.dueDate && new Date(inv.dueDate) < now
      ? Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customer?.name || "",
      invoiceDate: inv.invoiceDate || "",
      dueDate: inv.dueDate || "",
      total,
      paid: inv.amountPaid,
      balance: parseFloat((total - inv.amountPaid).toFixed(2)),
      daysOverdue,
      status: inv.status,
    };
  });

  return buildWorkbook("Debtors", columns, rows);
};
