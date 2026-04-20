import * as ExpenseService from "./expense.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendResponse from "../../utils/sendResponse.js";
import { logAudit } from "../../utils/auditLog.js";

export const createExpenseController = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.createExpense(req.body);
  logAudit(req, "CREATE", "Expense", expense._id, `Recorded expense: ${expense.category} ₹${expense.amount}`);
  sendResponse(res, 201, expense, "Expense recorded");
});

export const getAllExpensesController = asyncHandler(async (req, res) => {
  const result = await ExpenseService.getAllExpenses(req.query);
  sendResponse(res, 200, result);
});

export const getExpenseByIdController = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.getExpenseById(req.params.id);
  sendResponse(res, 200, expense);
});

export const updateExpenseController = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.updateExpense(req.params.id, req.body);
  logAudit(req, "UPDATE", "Expense", expense._id, `Updated expense: ${expense.category} ₹${expense.amount}`);
  sendResponse(res, 200, expense, "Expense updated");
});

export const deleteExpenseController = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.deleteExpense(req.params.id);
  logAudit(req, "DELETE", "Expense", expense._id, `Deleted expense ${expense.referenceNo || expense.category}`, expense.referenceNo || expense.category);
  sendResponse(res, 200, null, "Expense deleted");
});
