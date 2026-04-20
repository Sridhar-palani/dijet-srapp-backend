import Investment from "./investment.model.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";

export const createInvestment = async (data) => {
  if (!data.name || !data.category || !data.amount || !data.purchaseDate)
    throw new AppError("name, category, amount, and purchaseDate are required", 400);
  return await new Investment(data).save();
};

export const getAllInvestments = async ({ page, limit } = {}) => {
  return paginate(
    Investment.find().sort({ purchaseDate: -1 }),
    Investment.countDocuments(),
    { page, limit }
  );
};

export const getInvestmentById = async (id) => {
  const inv = await Investment.findById(id);
  if (!inv) throw new AppError("Investment not found", 404);
  return inv;
};

export const updateInvestment = async (id, data) => {
  const inv = await Investment.findByIdAndUpdate(id, data, { new: true });
  if (!inv) throw new AppError("Investment not found", 404);
  return inv;
};

export const deleteInvestment = async (id) => {
  const inv = await Investment.findByIdAndDelete(id);
  if (!inv) throw new AppError("Investment not found", 404);
  return inv;
};

// Summary: total invested, by category, by status
export const getInvestmentSummary = async () => {
  const all = await Investment.find();
  const totalInvested = all.reduce((s, i) => s + i.amount, 0);
  const byCategory = {};
  const byStatus = {};
  for (const inv of all) {
    byCategory[inv.category] = (byCategory[inv.category] || 0) + inv.amount;
    byStatus[inv.status] = (byStatus[inv.status] || 0) + inv.amount;
  }
  return { totalInvested, byCategory, byStatus, count: all.length };
};
