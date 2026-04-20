import Vendor from "./vendor.model.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";
import { nextSequence } from "../../utils/counter.js";

const generateVendorAccount = async () => {
  const seq = await nextSequence("vendor");
  return `V-${String(seq).padStart(3, "0")}`;
};

export const createVendor = async (data) => {
  if (!data.name) throw new AppError("Vendor name is required", 400);
  const vendorAccount = await generateVendorAccount();
  const vendor = new Vendor({ ...data, vendorAccount });
  return await vendor.save();
};

export const getAllVendors = async ({ page, limit } = {}) => {
  return paginate(Vendor.find().sort({ createdAt: -1 }), Vendor.countDocuments(), { page, limit });
};

export const getVendorById = async (id) => {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new AppError("Vendor not found", 404);
  return vendor;
};

export const updateVendor = async (id, data) => {
  const vendor = await Vendor.findByIdAndUpdate(id, data, { new: true });
  if (!vendor) throw new AppError("Vendor not found", 404);
  return vendor;
};

export const deleteVendor = async (id) => {
  const vendor = await Vendor.findByIdAndDelete(id);
  if (!vendor) throw new AppError("Vendor not found", 404);
  return vendor;
};
