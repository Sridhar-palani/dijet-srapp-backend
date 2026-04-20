import GRN from "./grn.model.js";
import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import Item from "../item/item.model.js";
import mongoose from "mongoose";
import { formatDateDDMMMYYYY } from "../quotation/helpers/quotation.helpers.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";
import { nextSequence } from "../../utils/counter.js";
import { getFinancialYear, getFYDateRange } from "../../constants/index.js";

const generateGRNNumber = async () => {
  const fy = getFinancialYear();
  const seq = await nextSequence("grn", fy);
  return `GRN-${String(seq).padStart(3, "0")}/${fy}`;
};

const resolvePOStatus = (po) => {
  const totalOrdered = po.items.reduce((s, i) => s + i.quantity, 0);
  const totalReceived = po.items.reduce((s, i) => s + (i.receivedQty || 0), 0);
  if (totalReceived <= 0) return "Open";
  if (totalReceived >= totalOrdered) return "Closed";
  return "Partially Received";
};

export const createGRN = async (data) => {
  if (!data.poId) throw new AppError("poId is required", 400);
  if (!data.items || data.items.length === 0)
    throw new AppError("At least one item is required", 400);

  const po = await PurchaseOrder.findById(data.poId);
  if (!po) throw new AppError("Purchase Order not found", 404);
  if (po.status === "Cancelled") throw new AppError("Cannot receive goods for a Cancelled PO", 400);

  // Pre-flight: validate receivedQty does not exceed remaining qty for each item
  for (const entry of data.items) {
    if (!entry.itemId) continue;
    const poItem = po.items.find((i) => i.itemId?.toString() === entry.itemId.toString());
    if (!poItem) throw new AppError(`Item ${entry.itemId} not found in Purchase Order`, 400);
    const remaining = poItem.quantity - (poItem.receivedQty || 0);
    if (entry.receivedQty > remaining) {
      throw new AppError(
        `Received qty (${entry.receivedQty}) exceeds remaining qty (${remaining}) for item "${entry.description || poItem.specification}"`,
        400
      );
    }
  }

  // Sequence number generated outside transaction — gaps on failure are acceptable
  const grnNumber = await generateGRNNumber();
  const receivedDate = data.receivedDate || formatDateDDMMMYYYY();
  const docDate = data.docDate ? new Date(data.docDate) : new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const grn = new GRN({ ...data, grnNumber, receivedDate, docDate });
    const savedGRN = await grn.save({ session });

    for (const entry of data.items) {
      if (!entry.itemId) continue;
      const poItem = po.items.find((i) => i.itemId?.toString() === entry.itemId.toString());

      const update = { $inc: { stock: entry.receivedQty } };
      if (poItem?.unitRate) update.lastBuyingCost = poItem.unitRate;
      await Item.findByIdAndUpdate(entry.itemId, update, { session });

      if (poItem) {
        poItem.receivedQty = (poItem.receivedQty || 0) + entry.receivedQty;
      }
    }

    po.status = resolvePOStatus(po);
    await po.save({ session });

    await session.commitTransaction();
    return savedGRN;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const updateGRN = async (id, data) => {
  const grn = await GRN.findById(id);
  if (!grn) throw new AppError("GRN not found", 404);

  const po = await PurchaseOrder.findById(grn.poId);
  if (po?.status === "Closed") {
    throw new AppError("Cannot edit GRN: the linked Purchase Order is already Closed", 400);
  }

  const newItems = data.items || grn.items;

  // Pre-flight: validate stock wouldn't go negative (net change per item)
  for (const oldEntry of grn.items) {
    if (!oldEntry.itemId) continue;
    const newEntry = newItems.find((i) => i.itemId?.toString() === oldEntry.itemId.toString());
    const newQty = newEntry ? newEntry.receivedQty : 0;
    const netChange = newQty - oldEntry.receivedQty;
    if (netChange < 0) {
      const item = await Item.findById(oldEntry.itemId).select("stock name");
      if (item && item.stock + netChange < 0) {
        throw new AppError(
          `Cannot update GRN: stock for "${item.name}" (${item.stock}) would go negative after net change (${netChange}).`,
          400
        );
      }
    }
  }

  // Pre-flight: validate new items against effective remaining PO qty
  if (po) {
    for (const newEntry of newItems) {
      if (!newEntry.itemId) continue;
      const poItem = po.items.find((i) => i.itemId?.toString() === newEntry.itemId.toString());
      if (!poItem) throw new AppError(`Item ${newEntry.itemId} not found in Purchase Order`, 400);
      const oldEntry = grn.items.find((i) => i.itemId?.toString() === newEntry.itemId.toString());
      const oldQty = oldEntry ? oldEntry.receivedQty : 0;
      // Remaining after conceptually reversing this GRN's old qty
      const effectiveRemaining = poItem.quantity - (poItem.receivedQty - oldQty);
      if (newEntry.receivedQty > effectiveRemaining) {
        throw new AppError(
          `Received qty (${newEntry.receivedQty}) exceeds remaining qty (${effectiveRemaining}) for item "${newEntry.description || poItem.specification}"`,
          400
        );
      }
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Reverse old items
    for (const oldEntry of grn.items) {
      if (!oldEntry.itemId) continue;
      await Item.findByIdAndUpdate(oldEntry.itemId, { $inc: { stock: -oldEntry.receivedQty } }, { session });
      if (po) {
        const poItem = po.items.find((i) => i.itemId?.toString() === oldEntry.itemId.toString());
        if (poItem) {
          poItem.receivedQty = Math.max(0, (poItem.receivedQty || 0) - oldEntry.receivedQty);
        }
      }
    }

    // Apply new items
    for (const newEntry of newItems) {
      if (!newEntry.itemId) continue;
      const poItem = po?.items.find((i) => i.itemId?.toString() === newEntry.itemId.toString());
      const update = { $inc: { stock: newEntry.receivedQty } };
      if (poItem?.unitRate) update.lastBuyingCost = poItem.unitRate;
      await Item.findByIdAndUpdate(newEntry.itemId, update, { session });
      if (poItem) {
        poItem.receivedQty = (poItem.receivedQty || 0) + newEntry.receivedQty;
      }
    }

    if (po) {
      po.status = resolvePOStatus(po);
      await po.save({ session });
    }

    grn.items = newItems;
    if (data.receivedDate !== undefined) grn.receivedDate = data.receivedDate;
    if (data.vendorInvoiceNo !== undefined) grn.vendorInvoiceNo = data.vendorInvoiceNo;
    if (data.vendorInvoiceDate !== undefined) grn.vendorInvoiceDate = data.vendorInvoiceDate;
    if (data.remarks !== undefined) grn.remarks = data.remarks;
    const saved = await grn.save({ session });

    await session.commitTransaction();
    return saved;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const getAllGRNs = async ({ page, limit, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.docDate = { $gte: startDate, $lt: endDate };
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const poIds = await PurchaseOrder.find({ poNumber: regex }).distinct("_id");
    filter.$or = [
      { grnNumber: regex },
      ...(poIds.length ? [{ poId: { $in: poIds } }] : []),
    ];
  }
  return paginate(
    GRN.find(filter)
      .populate({ path: "poId", select: "poNumber vendor status", populate: { path: "vendor", select: "name" } })
      .populate("items.itemId", "name hsnCode")
      .sort({ docDate: -1 }),
    GRN.countDocuments(filter),
    { page, limit }
  );
};

export const getGRNById = async (id) => {
  const grn = await GRN.findById(id).populate("poId").populate("items.itemId");
  if (!grn) throw new AppError("GRN not found", 404);
  return grn;
};

export const deleteGRN = async (id) => {
  const grn = await GRN.findById(id);
  if (!grn) throw new AppError("GRN not found", 404);

  const po = await PurchaseOrder.findById(grn.poId);
  if (po?.status === "Closed") {
    throw new AppError("Cannot delete GRN: the linked Purchase Order is already Closed", 400);
  }

  // Pre-flight: ensure no item's stock would go negative before mutating anything
  for (const entry of grn.items) {
    if (!entry.itemId) continue;
    const item = await Item.findById(entry.itemId).select("stock name");
    if (item && item.stock < entry.receivedQty) {
      throw new AppError(
        `Cannot delete GRN: stock for "${item.name}" (${item.stock}) is less than received qty (${entry.receivedQty}). Stock was already consumed by a Delivery Note.`,
        400
      );
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    for (const entry of grn.items) {
      if (!entry.itemId) continue;
      await Item.findByIdAndUpdate(entry.itemId, { $inc: { stock: -entry.receivedQty } }, { session });
      if (po) {
        const poItem = po.items.find((i) => i.itemId?.toString() === entry.itemId.toString());
        if (poItem) {
          poItem.receivedQty = Math.max(0, (poItem.receivedQty || 0) - entry.receivedQty);
        }
      }
    }

    if (po) {
      po.status = resolvePOStatus(po);
      await po.save({ session });
    }

    await grn.deleteOne({ session });

    await session.commitTransaction();
    return grn;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
