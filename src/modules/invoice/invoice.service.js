import Invoice from "./invoice.model.js";
import DeliveryNote from "../delivery_note/delivery_note.model.js";
import CustomerPO from "../customer_po/customer_po.model.js";
import Customer from "../customer/customer.model.js";
import mongoose from "mongoose";
import resolveCPOStatus from "../../utils/resolveCPOStatus.js";
import { formatDateDDMMMYYYY } from "../quotation/helpers/quotation.helpers.js";
import AppError from "../../utils/AppError.js";
import { SELLER, DEFAULT_INVOICE_TERMS, DEFAULT_GST_RATE, getFinancialYear, getFYDateRange } from "../../constants/index.js";
import { paginate } from "../../utils/paginate.js";
import { nextSequence } from "../../utils/counter.js";

// Resolves DN status from item invoiced quantities
const resolveDNStatus = (items) => {
  const allInvoiced = items.every((i) => (i.invoicedQty || 0) >= i.deliveredQty);
  const anyInvoiced = items.some((i) => (i.invoicedQty || 0) > 0);
  if (allInvoiced) return "Invoiced";
  if (anyInvoiced) return "Partially Invoiced";
  return "Pending";
};

const generateInvoiceNumber = async () => {
  const fy = getFinancialYear();
  const seq = await nextSequence("invoice", fy);
  return `DI/${String(seq).padStart(3, "0")}/${fy}`;
};

const normalizeState = (s) => {
  if (!s) return "";
  const v = s.trim().toLowerCase().replace(/\s+/g, " ");
  const aliases = { mh: "maharashtra", maha: "maharashtra" };
  return aliases[v] || v;
};

// Determine tax type based on buyer state vs seller state
const applyTax = (taxableAmount, buyerState, gstRate = DEFAULT_GST_RATE) => {
  const isSameState =
    normalizeState(buyerState) === SELLER.state.toLowerCase();

  if (isSameState) {
    const halfRate = gstRate / 2;
    const sgstAmt = parseFloat(((taxableAmount * halfRate) / 100).toFixed(2));
    const cgstAmt = parseFloat(((taxableAmount * halfRate) / 100).toFixed(2));
    return { sgst: { rate: halfRate, amount: sgstAmt }, cgst: { rate: halfRate, amount: cgstAmt }, igst: { rate: 0, amount: 0 } };
  }
  const igstAmt = parseFloat(((taxableAmount * gstRate) / 100).toFixed(2));
  return { sgst: { rate: 0, amount: 0 }, cgst: { rate: 0, amount: 0 }, igst: { rate: gstRate, amount: igstAmt } };
};

// Create Invoice from a Delivery Note — supports partial invoicing per item
// Pass data.itemQty: { "<dnItemId>": quantity } to invoice specific quantities.
// Omit data.itemQty to invoice all pending quantities in one shot.
export const createFromChallan = async (deliveryNoteId, data) => {
  const dn = await DeliveryNote.findById(deliveryNoteId)
    .populate("customer")
    .populate("items.itemId")
    .populate("quotationId");
  if (!dn) throw new AppError("Delivery Note not found", 404);
  if (dn.status === "Invoiced") throw new AppError("All items in this Delivery Note are already fully invoiced", 400);

  // Build CPO item price map: cpoItemId → unitPrice
  const cpoItemPrices = {};
  if (dn.cpoId) {
    const cpo = await CustomerPO.findById(dn.cpoId).select("items");
    if (cpo) {
      for (const ci of cpo.items) {
        cpoItemPrices[ci._id.toString()] = ci.unitPrice || 0;
      }
    }
  }

  const customer = dn.customer;
  const buyerState = customer.state || "";
  const gstRate = data.gstRate || DEFAULT_GST_RATE;

  // Pre-flight: build entries and validate quantities
  const entries = [];
  for (const dnItem of dn.items) {
    const pendingQty = dnItem.deliveredQty - (dnItem.invoicedQty || 0);
    if (pendingQty <= 0) continue;

    const requestedQty = data.itemQty?.[dnItem._id.toString()];
    const quantity = requestedQty !== undefined ? Number(requestedQty) : pendingQty;

    if (quantity <= 0) continue;
    if (quantity > pendingQty) {
      throw new AppError(
        `Cannot invoice ${quantity} for "${dnItem.description}" — only ${pendingQty} pending`,
        400
      );
    }

    const unitRate = data.itemRates?.[dnItem._id.toString()]
      ?? cpoItemPrices[dnItem.cpoItemId?.toString()]
      ?? 0;
    const discount = data.itemDiscounts?.[dnItem._id.toString()] || 0;
    const taxableAmount = parseFloat(((unitRate - (unitRate * discount) / 100) * quantity).toFixed(2));
    const tax = applyTax(taxableAmount, buyerState, gstRate);

    entries.push({
      dnItem,
      quantity,
      invoiceItem: {
        itemId: dnItem.itemId?._id,
        description: dnItem.description,
        hsnCode: dnItem.hsnCode,
        quantity,
        unitRate,
        discount,
        taxableAmount,
        sgst: tax.sgst,
        cgst: tax.cgst,
        igst: tax.igst,
      },
    });
  }

  if (entries.length === 0) throw new AppError("No pending items to invoice on this Delivery Note", 400);

  const invoiceItems = entries.map((e) => e.invoiceItem);
  const totalBeforeTax = parseFloat(invoiceItems.reduce((s, i) => s + i.taxableAmount, 0).toFixed(2));
  const totalSGST = parseFloat(invoiceItems.reduce((s, i) => s + i.sgst.amount, 0).toFixed(2));
  const totalCGST = parseFloat(invoiceItems.reduce((s, i) => s + i.cgst.amount, 0).toFixed(2));
  const totalIGST = parseFloat(invoiceItems.reduce((s, i) => s + i.igst.amount, 0).toFixed(2));
  const totalTax = parseFloat((totalSGST + totalCGST + totalIGST).toFixed(2));
  const totalAfterTax = parseFloat((totalBeforeTax + totalTax).toFixed(2));

  // Generate number outside transaction — gaps on failure are acceptable
  const invoiceNumber = await generateInvoiceNumber();
  const invoiceDate = formatDateDDMMMYYYY();

  const docDate = data.docDate ? new Date(data.docDate) : new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const invoice = new Invoice({
      invoiceNumber,
      deliveryNoteId: dn._id,
      quotationId: dn.quotationId,
      customer: customer._id,
      invoiceDate,
      docDate,
      billTo: {
        name: customer.name,
        address: customer.address,
        gstin: customer.gstin,
        stateCode: customer.gstin
          ? `${customer.gstin.slice(0, 2)} - ${customer.state || ""}`
          : customer.state || "",
        phone: customer.phone,
        email: customer.email,
      },
      shipTo: {
        name: customer.name,
        address: customer.address,
      },
      buyerOrderNo: data.buyerOrderNo || "Verbal",
      buyerOrderDate: data.buyerOrderDate || "-",
      dispatchDocNo: data.dispatchDocNo || "-",
      eWayBillNo: data.eWayBillNo || "-",
      deliveryNote: data.deliveryNote || "-",
      dispatchedThrough: dn.dispatchedThrough || data.dispatchedThrough || "By Hand",
      paymentTerms: data.paymentTerms || "30 Days",
      items: invoiceItems,
      taxSummary: { totalBeforeTax, totalSGST, totalCGST, totalIGST, totalTax, totalAfterTax },
      termsAndConditions: data.termsAndConditions || DEFAULT_INVOICE_TERMS,
      status: "Draft",
    });
    const savedInvoice = await invoice.save({ session });

    // Update DN item invoicedQty
    for (const { dnItem, quantity } of entries) {
      dnItem.invoicedQty = (dnItem.invoicedQty || 0) + quantity;
    }
    dn.status = resolveDNStatus(dn.items);
    await dn.save({ session });

    // Update CPO invoicedQty via cpoId chain
    if (dn.cpoId) {
      const cpo = await CustomerPO.findById(dn.cpoId).session(session);
      if (cpo) {
        for (const { dnItem, quantity } of entries) {
          if (!dnItem.cpoItemId) continue;
          const cpoItem = cpo.items.id(dnItem.cpoItemId);
          if (cpoItem) {
            cpoItem.invoicedQty = (cpoItem.invoicedQty || 0) + quantity;
          }
        }
        cpo.status = resolveCPOStatus(cpo.items, cpo.status);
        await cpo.save({ session });
      }
    }

    await session.commitTransaction();
    return savedInvoice;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const createInvoice = async (data) => {
  if (!data.deliveryNoteId) throw new AppError("deliveryNoteId is required", 400);
  return await createFromChallan(data.deliveryNoteId, data);
};

export const getAllInvoices = async ({ page, limit, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.docDate = { $gte: startDate, $lt: endDate };
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const customerIds = await Customer.find({ name: regex }).distinct("_id");
    filter.$or = [
      { invoiceNumber: regex },
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ];
  }
  return paginate(
    Invoice.find(filter)
      .populate("customer", "name email")
      .populate("deliveryNoteId", "dnNumber deliveryDate")
      .sort({ docDate: -1 }),
    Invoice.countDocuments(filter),
    { page, limit }
  );
};

export const getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id)
    .populate("customer")
    .populate("deliveryNoteId")
    .populate("quotationId")
    .populate("items.itemId");
  if (!invoice) throw new AppError("Invoice not found", 404);
  return invoice;
};

export const updateInvoice = async (id, data) => {
  // Strip system-computed/financial fields — these must only change through dedicated flows
  const { taxSummary, amountPaid, payments, invoiceNumber, deliveryNoteId, ...safeData } = data;
  const invoice = await Invoice.findByIdAndUpdate(id, safeData, { new: true })
    .populate("customer", "name email");
  if (!invoice) throw new AppError("Invoice not found", 404);
  return invoice;
};

export const deleteInvoice = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError("Invoice not found", 404);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Reverse DN invoicedQty and recalculate DN status
    if (invoice.deliveryNoteId) {
      const dn = await DeliveryNote.findById(invoice.deliveryNoteId).session(session);
      if (dn) {
        const matchedEntries = invoice.items.map((invoiceItem) => {
          const dnItem = dn.items.find(
            (d) =>
              (invoiceItem.itemId && d.itemId?.toString() === invoiceItem.itemId?.toString()) ||
              d.description === invoiceItem.description
          );
          return { invoiceItem, dnItem };
        });

        for (const { invoiceItem, dnItem } of matchedEntries) {
          if (dnItem) {
            dnItem.invoicedQty = Math.max(0, (dnItem.invoicedQty || 0) - Number(invoiceItem.quantity));
          }
        }
        dn.status = resolveDNStatus(dn.items);
        await dn.save({ session });

        // Reverse CPO invoicedQty and recalculate CPO status
        if (dn.cpoId) {
          const cpo = await CustomerPO.findById(dn.cpoId).session(session);
          if (cpo) {
            for (const { invoiceItem, dnItem } of matchedEntries) {
              if (!dnItem?.cpoItemId) continue;
              const cpoItem = cpo.items.id(dnItem.cpoItemId);
              if (cpoItem) {
                cpoItem.invoicedQty = Math.max(0, (cpoItem.invoicedQty || 0) - Number(invoiceItem.quantity));
              }
            }
            cpo.status = resolveCPOStatus(cpo.items, cpo.status);
            await cpo.save({ session });
          }
        }
      }
    }

    await invoice.deleteOne({ session });

    await session.commitTransaction();
    return invoice;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
