import DeliveryNote from "./delivery_note.model.js";
import CustomerPO from "../customer_po/customer_po.model.js";
import Customer from "../customer/customer.model.js";
import Item from "../item/item.model.js";
import mongoose from "mongoose";
import resolveCPOStatus from "../../utils/resolveCPOStatus.js";
import { formatDateDDMMMYYYY } from "../quotation/helpers/quotation.helpers.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";
import { nextSequence } from "../../utils/counter.js";
import { getFinancialYear, getFYDateRange } from "../../constants/index.js";

const generateDNNumber = async () => {
  const fy = getFinancialYear();
  const seq = await nextSequence("dn", fy);
  return `DN-${String(seq).padStart(3, "0")}/${fy}`;
};

export const createDeliveryNote = async (data) => {
  if (!data.customer) throw new AppError("Customer is required", 400);
  if (!data.items || data.items.length === 0) throw new AppError("At least one item is required", 400);

  // Pre-flight: stock validation for all items before any mutation
  for (const entry of data.items) {
    if (!entry.itemId) continue;
    const item = await Item.findById(entry.itemId);
    if (!item) throw new AppError(`Item not found for "${entry.description}"`, 404);
    const deliveredQty = Number(entry.deliveredQty);
    if (item.stock < deliveredQty) {
      throw new AppError(
        `Insufficient stock for "${entry.description}" — available: ${item.stock}, requested: ${deliveredQty}`,
        400
      );
    }
  }

  const dnNumber = await generateDNNumber();
  const deliveryDate = data.deliveryDate || formatDateDDMMMYYYY();
  const docDate = data.docDate ? new Date(data.docDate) : new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const dn = new DeliveryNote({ ...data, dnNumber, deliveryDate, docDate });
    const savedDN = await dn.save({ session });

    const stockUpdates = data.items
      .filter((entry) => entry.itemId)
      .map((entry) =>
        Item.findByIdAndUpdate(entry.itemId, { $inc: { stock: -Number(entry.deliveredQty) } }, { session })
      );
    await Promise.all(stockUpdates);

    await session.commitTransaction();
    return savedDN;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// Create DN from a CPO — validates stock, deducts stock, updates CPO deliveredQty
export const createFromCPO = async (cpoId, data) => {
  const cpo = await CustomerPO.findById(cpoId)
    .populate("customer")
    .populate("items.itemId");
  if (!cpo) throw new AppError("Customer PO not found", 404);
  if (cpo.status === "Closed") {
    throw new AppError("Cannot create Delivery Note for a Closed CPO", 400);
  }

  const entries = data.items;
  if (!entries || entries.length === 0) throw new AppError("At least one item is required", 400);

  const dnItems = [];

  // Pre-flight: validate all entries before any mutation
  for (const entry of entries) {
    const cpoItem = cpo.items.id(entry.cpoItemId);
    if (!cpoItem) throw new AppError(`CPO item ${entry.cpoItemId} not found`, 400);

    const deliveredQty = Number(entry.deliveredQty);
    if (!deliveredQty || deliveredQty <= 0)
      throw new AppError(`Delivered quantity must be > 0 for item ${cpoItem.description}`, 400);

    const pendingDelivery = cpoItem.orderedQty - (cpoItem.deliveredQty || 0);
    if (deliveredQty > pendingDelivery) {
      throw new AppError(
        `Cannot deliver ${deliveredQty} of "${cpoItem.description}" — only ${pendingDelivery} units pending`,
        400
      );
    }

    if (cpoItem.itemId) {
      const item = await Item.findById(cpoItem.itemId._id || cpoItem.itemId);
      if (!item) throw new AppError(`Item not found for "${cpoItem.description}"`, 404);
      if (item.stock < deliveredQty) {
        throw new AppError(
          `Insufficient stock for "${cpoItem.description}" — available: ${item.stock}, requested: ${deliveredQty}`,
          400
        );
      }
    }

    dnItems.push({
      itemId: cpoItem.itemId?._id || cpoItem.itemId,
      cpoItemId: cpoItem._id,
      description: cpoItem.description,
      hsnCode: cpoItem.hsnCode,
      unit: cpoItem.unit,
      orderedQty: cpoItem.orderedQty,
      deliveredQty,
      remarks: entry.remarks,
    });
  }

  const dnNumber = await generateDNNumber();
  const deliveryDate = data.deliveryDate || formatDateDDMMMYYYY();
  const docDate = data.docDate ? new Date(data.docDate) : new Date();

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const dn = new DeliveryNote({
      dnNumber,
      cpoId: cpo._id,
      quotationId: cpo.quotationId,
      customer: cpo.customer._id,
      items: dnItems,
      dispatchedThrough: data.dispatchedThrough,
      vehicleNo: data.vehicleNo,
      deliveryDate,
      docDate,
      remarks: data.remarks,
    });
    const savedDN = await dn.save({ session });

    const stockDeductions = [];
    for (const entry of entries) {
      const cpoItem = cpo.items.id(entry.cpoItemId);
      const deliveredQty = Number(entry.deliveredQty);

      if (cpoItem.itemId) {
        stockDeductions.push(
          Item.findByIdAndUpdate(
            cpoItem.itemId._id || cpoItem.itemId,
            { $inc: { stock: -deliveredQty } },
            { session }
          )
        );
      }

      cpoItem.deliveredQty = (cpoItem.deliveredQty || 0) + deliveredQty;
    }
    await Promise.all(stockDeductions);

    cpo.status = resolveCPOStatus(cpo.items, cpo.status);
    await cpo.save({ session });

    await session.commitTransaction();
    return savedDN;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

export const getAllDeliveryNotes = async ({ page, limit, excludeStatus, status, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.docDate = { $gte: startDate, $lt: endDate };
  }
  if (excludeStatus) filter.status = { $ne: excludeStatus };
  else if (status) filter.status = status;
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const customerIds = await Customer.find({ name: regex }).distinct("_id");
    filter.$or = [
      { dnNumber: regex },
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ];
  }

  return paginate(
    DeliveryNote.find(filter)
      .populate("customer", "name email")
      .populate("cpoId", "cpoNumber")
      .sort({ docDate: -1 }),
    DeliveryNote.countDocuments(filter),
    { page, limit }
  );
};

export const getDeliveryNoteById = async (id) => {
  const dn = await DeliveryNote.findById(id)
    .populate("customer")
    .populate("cpoId")
    .populate("poId")
    .populate("quotationId")
    .populate("items.itemId");
  if (!dn) throw new AppError("Delivery Note not found", 404);
  return dn;
};

export const updateDeliveryNote = async (id, data) => {
  const { dnNumber, ...safeData } = data;
  if (safeData.items) {
    // Preserve system-managed invoicedQty per item
    const existing = await DeliveryNote.findById(id);
    if (existing) {
      safeData.items = safeData.items.map((incoming) => {
        const existingItem = incoming._id ? existing.items.id(incoming._id) : null;
        return { ...incoming, invoicedQty: existingItem?.invoicedQty || 0 };
      });
    }
  }
  const dn = await DeliveryNote.findByIdAndUpdate(id, safeData, { new: true })
    .populate("customer", "name email");
  if (!dn) throw new AppError("Delivery Note not found", 404);
  return dn;
};

export const deleteDeliveryNote = async (id) => {
  const dn = await DeliveryNote.findById(id);
  if (!dn) throw new AppError("Delivery Note not found", 404);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Reverse stock deductions
    const stockReversals = dn.items
      .filter((dnItem) => dnItem.itemId)
      .map((dnItem) =>
        Item.findByIdAndUpdate(dnItem.itemId, { $inc: { stock: Number(dnItem.deliveredQty) } }, { session })
      );
    await Promise.all(stockReversals);

    // Reverse CPO deliveredQty and recalculate status
    if (dn.cpoId) {
      const cpo = await CustomerPO.findById(dn.cpoId).session(session);
      if (cpo) {
        for (const dnItem of dn.items) {
          if (!dnItem.cpoItemId) continue;
          const cpoItem = cpo.items.id(dnItem.cpoItemId);
          if (cpoItem) {
            cpoItem.deliveredQty = Math.max(0, (cpoItem.deliveredQty || 0) - Number(dnItem.deliveredQty));
          }
        }
        cpo.status = resolveCPOStatus(cpo.items, cpo.status);
        await cpo.save({ session });
      }
    }

    await dn.deleteOne({ session });

    await session.commitTransaction();
    return dn;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};
