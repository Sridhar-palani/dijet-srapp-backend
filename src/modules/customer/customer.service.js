import Customer from "./customer.model.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";

export const createCustomer = async (data) => {
  if (!data.name) throw new AppError("Customer name is required", 400);
  const existing = data.email ? await Customer.findOne({ email: data.email }) : null;
  if (existing) throw new AppError("A customer with this email already exists", 409);
  const customer = new Customer(data);
  return await customer.save();
};

export const getAllCustomers = async ({ page, limit } = {}) => {
  return paginate(Customer.find().sort({ name: 1 }), Customer.countDocuments(), { page, limit });
};

export const getCustomerById = async (id) => {
  const customer = await Customer.findById(id);
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
};

export const updateCustomer = async (id, data) => {
  const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
};

export const deleteCustomer = async (id) => {
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) throw new AppError("Customer not found", 404);
  return customer;
};
