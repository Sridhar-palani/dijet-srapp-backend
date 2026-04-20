import CustomerPO from "./customer_po.model.js";
import Quotation from "../quotation/quotation.model.js";
import Customer from "../customer/customer.model.js";
import DeliveryNote from "../delivery_note/delivery_note.model.js";
import Invoice from "../invoice/invoice.model.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";
import { getFYDateRange } from "../../constants/index.js";

export const createCustomerPO = async (data) => {
  if (!data.customer) throw new AppError("Customer is required", 400);
  if (!data.cpoNumber) throw new AppError("CPO number is required", 400);
  if (!data.items || data.items.length === 0)
    throw new AppError("At least one item is required", 400);

  const existing = await CustomerPO.findOne({ cpoNumber: data.cpoNumber });
  if (existing) throw new AppError(`CPO number "${data.cpoNumber}" already exists`, 409);

  const cpo = new CustomerPO({ ...data, cpoDate: data.cpoDate ? new Date(data.cpoDate) : new Date(), status: "Confirmed" });
  const saved = await cpo.save();

  // If linked to a quotation, mark it as Converted
  if (data.quotationId) {
    await Quotation.findByIdAndUpdate(data.quotationId, { status: "Converted" });
  }

  return saved;
};

// Create CPO directly from a Quotation — inherits all items
export const createFromQuotation = async (quotationId, extra = {}) => {
  const quotation = await Quotation.findById(quotationId)
    .populate("customer")
    .populate("items.itemData");

  if (!quotation) throw new AppError("Quotation not found", 404);
  if (!extra.cpoNumber) throw new AppError("CPO number is required", 400);

  const existing = await CustomerPO.findOne({ cpoNumber: extra.cpoNumber });
  if (existing) throw new AppError(`CPO number "${extra.cpoNumber}" already exists`, 409);

  const inheritedItems = quotation.items.map((item) => ({
    itemId: item.itemData?._id,
    description: item.itemData?.name || item.notes || "Item",
    make: item.itemData?.make,
    hsnCode: item.hsncode,
    unit: "pcs",
    unitPrice: item.unitPrice || 0,
    orderedQty: item.quantity,
  }));

  const additionalItems = extra.additionalItems || [];
  const items = [...inheritedItems, ...additionalItems];

  const cpo = new CustomerPO({
    cpoNumber: extra.cpoNumber,
    cpoDate: extra.cpoDate ? new Date(extra.cpoDate) : new Date(),
    quotationId: quotation._id,
    customer: quotation.customer._id,
    items,
    remarks: extra.remarks,
    status: "Confirmed",
  });

  await Quotation.findByIdAndUpdate(quotationId, { status: "Converted" });

  return await cpo.save();
};

export const getAllCustomerPOs = async ({ page, limit, status, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.cpoDate = { $gte: startDate, $lt: endDate };
  }
  if (status) filter.status = Array.isArray(status) ? { $in: status } : status;
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const customerIds = await Customer.find({ name: regex }).distinct("_id");
    filter.$or = [
      { cpoNumber: regex },
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ];
  }
  const result = await paginate(
    CustomerPO.find(filter)
      .populate("customer", "name email phone")
      .populate("items.itemId", "name make hsnCode stock")
      .populate("items.vendorId", "name")
      .sort({ cpoDate: -1 }),
    CustomerPO.countDocuments(filter),
    { page, limit }
  );
  return { ...result, data: result.data.map(addDerivedQty) };
};

export const getCustomerPOById = async (id) => {
  const cpo = await CustomerPO.findById(id)
    .populate("customer")
    .populate("items.itemId")
    .populate("items.vendorId")
    .populate("quotationId");
  if (!cpo) throw new AppError("Customer PO not found", 404);
  return addDerivedQty(cpo);
};

export const updateCustomerPO = async (id, data) => {
  const existing = await CustomerPO.findById(id);
  if (!existing) throw new AppError("Customer PO not found", 404);

  if (data.items) {
    // Preserve system-managed deliveredQty and invoicedQty per item
    data.items = data.items.map((incoming) => {
      const existingItem = incoming._id ? existing.items.id(incoming._id) : null;
      return {
        ...incoming,
        deliveredQty: existingItem?.deliveredQty || 0,
        invoicedQty: existingItem?.invoicedQty || 0,
      };
    });
  }

  const updated = await CustomerPO.findByIdAndUpdate(id, data, { new: true })
    .populate("customer", "name email phone")
    .populate("items.itemId", "name make hsnCode stock");
  return addDerivedQty(updated);
};

export const deleteCustomerPO = async (id) => {
  const cpo = await CustomerPO.findById(id);
  if (!cpo) throw new AppError("Customer PO not found", 404);
  await cpo.deleteOne();
  return cpo;
};

export const getCPODeliveryNotes = async (cpoId) => {
  const cpo = await CustomerPO.findById(cpoId);
  if (!cpo) throw new AppError("Customer PO not found", 404);
  return await DeliveryNote.find({ cpoId })
    .populate("customer", "name email")
    .sort({ docDate: -1 });
};

export const getCPOInvoices = async (cpoId) => {
  const cpo = await CustomerPO.findById(cpoId);
  if (!cpo) throw new AppError("Customer PO not found", 404);

  const deliveryNotes = await DeliveryNote.find({ cpoId }, "_id");
  const dnIds = deliveryNotes.map((dn) => dn._id);

  const invoices = await Invoice.find({ deliveryNoteId: { $in: dnIds } })
    .populate("customer", "name email")
    .populate("deliveryNoteId", "dnNumber deliveryDate")
    .sort({ docDate: -1 });

  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.taxSummary?.totalAfterTax || 0), 0);
  const totalCollected = invoices.reduce((s, inv) => s + (inv.amountPaid || 0), 0);

  return {
    cpoId,
    invoiceCount: invoices.length,
    totalInvoiced: parseFloat(totalInvoiced.toFixed(2)),
    totalCollected: parseFloat(totalCollected.toFixed(2)),
    totalOutstanding: parseFloat((totalInvoiced - totalCollected).toFixed(2)),
    invoices,
  };
};

export const getLastCustomerItemPrice = async (customerId, itemId) => {
  if (!customerId || !itemId) throw new AppError("customerId and itemId are required", 400);
  const cpo = await CustomerPO.findOne({
    customer: customerId,
    "items.itemId": itemId,
    "items.unitPrice": { $gt: 0 },
  }).sort({ cpoDate: -1 });

  const item = cpo?.items?.find(
    (it) => it.itemId?.toString() === itemId && (it.unitPrice || 0) > 0
  );
  return { unitPrice: item?.unitPrice || null };
};

// Adds computed pendingDeliveryQty and pendingInvoiceQty per item
const addDerivedQty = (cpo) => {
  const obj = cpo.toObject ? cpo.toObject() : cpo;
  obj.items = obj.items.map((item) => ({
    ...item,
    pendingDeliveryQty: item.orderedQty - (item.deliveredQty || 0),
    pendingInvoiceQty: (item.deliveredQty || 0) - (item.invoicedQty || 0),
  }));
  return obj;
};
