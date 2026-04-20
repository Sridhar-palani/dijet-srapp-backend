import Quotation from "./quotation.model.js";
import Customer from "../customer/customer.model.js";
import Item from "../item/item.model.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";
import {
  calculateItem,
  totalNet,
  validateQuotationData,
  formatDateDDMMMYYYY,
} from "./helpers/quotation.helpers.js";
import { nextSequence } from "../../utils/counter.js";
import { getFinancialYear, getFYDateRange } from "../../constants/index.js";

const generateQuotationNumber = async () => {
  const fy = getFinancialYear();
  const seq = await nextSequence("quotation", fy);
  return `QT-${String(seq).padStart(3, "0")}/${fy}`;
};

// Check if any item discount exceeds its item's maxDiscountPercent
const resolveQuotationStatus = async (items) => {
  for (const item of items) {
    if (!item.itemId || !(item.discountPercent > 0)) continue;
    const itemDoc = await Item.findById(item.itemId).select("maxDiscountPercent");
    if (itemDoc && item.discountPercent > (itemDoc.maxDiscountPercent ?? 100)) {
      return "Pending Approval";
    }
  }
  return "Active";
};

export const createQuotation = async (data) => {
  validateQuotationData(data);

  const customer = await Customer.findById(data.customer);
  if (!customer) throw new AppError("Customer not found", 404);

  const items = calculateItem(data.items);
  const netTotal = totalNet(items);
  const date = formatDateDDMMMYYYY();
  const status = await resolveQuotationStatus(data.items);

  const updatedData = {
    customer: data.customer,
    quotationNumber: await generateQuotationNumber(),
    items: items.map((item) => ({
      itemData: item.itemId,
      listprice: item.listprice,
      discountPercent: item.discountPercent,
      unitPrice: item.unitPrice,
      itemtotal: item.itemtotal,
      notes: item.notes,
      delivery: item.delivery,
      tax: item.tax,
      hsncode: item.hsncode,
      quantity: item.quantity,
    })),
    date: date,
    docDate: data.docDate ? new Date(data.docDate) : new Date(),
    paymentTerms: data.paymentTerms,
    transportCharges: data.transportCharges,
    packingCharges: data.packingCharges,
    enquiryDetails: data.enquiryDetails,
    remarks: data.remarks,
    totalnet: netTotal,
    grosstotal: netTotal,
    validuntil: data.validuntil,
    status,
  };
  const quotation = new Quotation(updatedData);
  return await quotation.save();
};

export const approveQuotation = async (id) => {
  const quotation = await Quotation.findById(id);
  if (!quotation) throw new AppError("Quotation not found", 404);
  if (quotation.status !== "Pending Approval")
    throw new AppError(`Quotation is not pending approval (current status: ${quotation.status})`, 400);
  quotation.status = "Active";
  return await quotation.save();
};
// Fetch all quotations
export const getAllQuotations = async ({ page, limit, search, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.docDate = { $gte: startDate, $lt: endDate };
  }
  if (search) {
    const regex = { $regex: search, $options: "i" };
    const customerIds = await Customer.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
    filter.$or = [
      { quotationNumber: regex },
      ...(customerIds.length ? [{ customer: { $in: customerIds } }] : []),
    ];
  }
  return paginate(Quotation.find(filter).populate("customer").sort({ docDate: -1 }), Quotation.countDocuments(filter), { page, limit });
};

// Fetch one quotation
export const getQuotationById = async (id) => {
  return await Quotation.findById(id).populate("customer").populate("items.itemData");
};

export const updateQuotation = async (id, data) => {
  if (data.items) {
    const items = calculateItem(data.items);
    const netTotal = totalNet(items);
    const status = await resolveQuotationStatus(data.items);
    data = {
      ...data,
      items: items.map((item) => ({
        itemData: item.itemId,
        listprice: item.listprice,
        discountPercent: item.discountPercent,
        unitPrice: item.unitPrice,
        itemtotal: item.itemtotal,
        notes: item.notes,
        delivery: item.delivery,
        tax: item.tax,
        hsncode: item.hsncode,
        quantity: item.quantity,
      })),
      totalnet: netTotal,
      grosstotal: netTotal,
      status,
    };
  }
  return await Quotation.findByIdAndUpdate(id, data, { new: true });
};

export const deleteQuotation = async (id) => {
  return await Quotation.findByIdAndDelete(id);
};
