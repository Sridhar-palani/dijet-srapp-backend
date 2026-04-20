import * as CustomerService from "./customer.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AppError from "../../utils/AppError.js";
import sendResponse from "../../utils/sendResponse.js";

export const createCustomerController = asyncHandler(async (req, res) => {
  const customer = await CustomerService.createCustomer(req.body);
  sendResponse(res, 201, customer, "Customer created successfully");
});

export const getAllCustomersController = asyncHandler(async (req, res) => {
  const result = await CustomerService.getAllCustomers(req.query);
  sendResponse(res, 200, result);
});

export const getCustomerByIdController = asyncHandler(async (req, res) => {
  const customer = await CustomerService.getCustomerById(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);
  sendResponse(res, 200, customer);
});

export const updateCustomerController = asyncHandler(async (req, res) => {
  const customer = await CustomerService.updateCustomer(req.params.id, req.body);
  if (!customer) throw new AppError("Customer not found", 404);
  sendResponse(res, 200, customer, "Customer updated successfully");
});

export const deleteCustomerController = asyncHandler(async (req, res) => {
  const customer = await CustomerService.deleteCustomer(req.params.id);
  if (!customer) throw new AppError("Customer not found", 404);
  sendResponse(res, 200, null, "Customer deleted successfully");
});
