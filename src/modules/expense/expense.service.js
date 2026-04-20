import Expense from "./expense.model.js";
import AppError from "../../utils/AppError.js";
import { formatDateDDMMMYYYY } from "../quotation/helpers/quotation.helpers.js";
import { paginate } from "../../utils/paginate.js";
import { getFYDateRange } from "../../constants/index.js";

export const createExpense = async (data) => {
  if (!data.category) throw new AppError("Category is required", 400);
  if (!data.amount || data.amount <= 0) throw new AppError("Valid amount is required", 400);
  if (!data.description) throw new AppError("Description is required", 400);

  const expense = new Expense({
    ...data,
    expenseDate: data.expenseDate || formatDateDDMMMYYYY(),
    docDate: data.docDate ? new Date(data.docDate) : new Date(),
  });
  return await expense.save();
};

export const getAllExpenses = async ({ page, limit, category, year } = {}) => {
  const filter = {};
  if (year) {
    const { startDate, endDate } = getFYDateRange(year);
    filter.docDate = { $gte: startDate, $lt: endDate };
  }
  if (category) filter.category = category;
  return paginate(
    Expense.find(filter).sort({ docDate: -1 }),
    Expense.countDocuments(filter),
    { page, limit }
  );
};

export const getExpenseById = async (id) => {
  const expense = await Expense.findById(id);
  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};

export const updateExpense = async (id, data) => {
  const expense = await Expense.findByIdAndUpdate(id, data, { new: true });
  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};

export const deleteExpense = async (id) => {
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) throw new AppError("Expense not found", 404);
  return expense;
};
