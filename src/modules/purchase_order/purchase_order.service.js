import PurchaseOrder from "./purchase_order.model.js";
import CustomerPO from "../customer_po/customer_po.model.js";
import GRN from "../grn/grn.model.js";
import Vendor from "../vendor/vendor.model.js";
import { amountInWords } from "../quotation/helpers/quotation.helpers.js";
import AppError from "../../utils/AppError.js";
import { SELLER, DEFAULT_PO_TERMS, getFinancialYear, getFYDateRange } from "../../constants/index.js";
import { paginate } from "../../utils/paginate.js";
import { nextSequence } from "../../utils/counter.js";

const generatePONumber = async () => {
  const fy = getFinancialYear();
  const seq = await nextSequence("po", fy);
  return `DI${String(seq).padStart(3, "0")}/${fy}`;
};

const calcPoItems = (items) =>
  items.map((item) => {
    const unitRate = item.listRate - (item.listRate * (item.discount || 0)) / 100;
    const total = unitRate * item.quantity;
    return { ...item, unitRate: parseFloat(unitRate.toFixed(2)), total: parseFloat(total.toFixed(2)) };
  });

export const createPurchaseOrder = async (data) => {
  if (!data.vendor) throw new AppError("Vendor is required", 400);
  if (!data.items || data.items.length === 0) throw new AppError("At least one item is required", 400);

  const items = calcPoItems(data.items);
  const foreignTotal = items.reduce((sum, i) => sum + i.total, 0);
  const exchangeRate = data.exchangeRate || 1;
  const totalAmount = parseFloat((foreignTotal * exchangeRate).toFixed(2));
  const poNumber = await generatePONumber();

  const po = new PurchaseOrder({
    ...data,
    poNumber,
    poDate: data.poDate ? new Date(data.poDate) : new Date(),
    items,
    exchangeRate,
    totalAmount,
    amountInWords: amountInWords(totalAmount),
    billTo: data.billTo || {
      name: SELLER.nameUpper,
      address: SELLER.address,
      gstin: SELLER.gstin,
      pan: SELLER.pan,
      state: SELLER.state,
      stateCode: SELLER.stateCode,
    },
    shipTo: data.shipTo || {
      address: SELLER.shipToAddress,
      phone: SELLER.shipToPhone,
      email: SELLER.shipToEmail,
    },
    termsAndConditions: data.termsAndConditions || DEFAULT_PO_TERMS,
  });
  return await po.save();
};

// Create one PO per vendor by grouping CPO items that have vendorId assigned
export const createFromCPO = async (cpoId, overrides = {}) => {
  const cpo = await CustomerPO.findById(cpoId)
    .populate("items.itemId")
    .populate("items.vendorId");
  if (!cpo) throw new AppError("Customer PO not found", 404);

  const itemsByVendor = {};
  for (const item of cpo.items) {
    if (!item.vendorId) continue;
    const vid = item.vendorId._id.toString();
    if (!itemsByVendor[vid]) itemsByVendor[vid] = { vendor: item.vendorId, items: [] };
    itemsByVendor[vid].items.push({
      itemId: item.itemId?._id,
      specification: item.description,
      quantity: item.orderedQty,
      uom: item.unit || "PCS",
      listRate: overrides.itemRates?.[item._id.toString()] || item.itemId?.lastBuyingCost || 0,
      discount: 0,
    });
  }

  if (Object.keys(itemsByVendor).length === 0) {
    throw new AppError(
      "No items with vendor assignments found in this CPO. Assign vendors to CPO items first.",
      400
    );
  }

  const createdPOs = [];
  for (const [, group] of Object.entries(itemsByVendor)) {
    const items = calcPoItems(group.items);
    const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
    const poNumber = await generatePONumber();

    const po = new PurchaseOrder({
      poNumber,
      poDate: overrides.poDate ? new Date(overrides.poDate) : new Date(),
      cpoId: cpo._id,
      quotationId: cpo.quotationId,
      vendor: group.vendor._id,
      exchangeRate: 1,
      billTo: {
        name: SELLER.nameUpper,
        address: SELLER.address,
        gstin: SELLER.gstin,
        pan: SELLER.pan,
        state: SELLER.state,
        stateCode: SELLER.stateCode,
      },
      shipTo: {
        address: SELLER.shipToAddress,
        phone: SELLER.shipToPhone,
        email: SELLER.shipToEmail,
      },
      items,
      currency: "INR",
      paymentTerms: overrides.paymentTerms || group.vendor.paymentTerms || "30 Days",
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      amountInWords: amountInWords(totalAmount),
      termsAndConditions: DEFAULT_PO_TERMS,
      status: "Open",
    });
    createdPOs.push(await po.save());
  }

  return createdPOs;
};

export const getAllPurchaseOrders = async ({ page, limit, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.poDate = { $gte: startDate, $lt: endDate };
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const vendorIds = await Vendor.find({ name: regex }).distinct("_id");
    filter.$or = [
      { poNumber: regex },
      ...(vendorIds.length ? [{ vendor: { $in: vendorIds } }] : []),
    ];
  }
  return paginate(
    PurchaseOrder.find(filter)
      .populate("vendor", "name email")
      .populate("cpoId", "cpoNumber")
      .sort({ poDate: -1 }),
    PurchaseOrder.countDocuments(filter),
    { page, limit }
  );
};

export const getPurchaseOrderById = async (id) => {
  const po = await PurchaseOrder.findById(id)
    .populate("vendor")
    .populate("cpoId")
    .populate("quotationId")
    .populate("items.itemId");
  if (!po) throw new AppError("Purchase Order not found", 404);
  return po;
};

export const updatePurchaseOrder = async (id, data) => {
  // Strip fields managed by payment and GRN flows
  const { poNumber, amountPaid, payments, ...safeData } = data;
  if (safeData.items) {
    // Preserve system-managed receivedQty per item
    const existing = await PurchaseOrder.findById(id);
    if (existing) {
      safeData.items = safeData.items.map((incoming) => {
        const existingItem = incoming._id ? existing.items.id(incoming._id) : null;
        return { ...incoming, receivedQty: existingItem?.receivedQty || 0 };
      });
    }
    safeData.items = calcPoItems(safeData.items);
    const foreignTotal = safeData.items.reduce((sum, i) => sum + i.total, 0);
    const exchangeRate = safeData.exchangeRate ?? existing?.exchangeRate ?? 1;
    safeData.totalAmount = parseFloat((foreignTotal * exchangeRate).toFixed(2));
    safeData.amountInWords = amountInWords(safeData.totalAmount);
  }
  const po = await PurchaseOrder.findByIdAndUpdate(id, safeData, { new: true })
    .populate("vendor", "name email");
  if (!po) throw new AppError("Purchase Order not found", 404);
  return po;
};

export const deletePurchaseOrder = async (id) => {
  const po = await PurchaseOrder.findByIdAndDelete(id);
  if (!po) throw new AppError("Purchase Order not found", 404);
  return po;
};

export const getPOGRNs = async (id) => {
  const po = await PurchaseOrder.findById(id);
  if (!po) throw new AppError("Purchase Order not found", 404);
  return await GRN.find({ poId: id })
    .populate("items.itemId", "name make")
    .sort({ docDate: -1 });
};
