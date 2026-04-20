import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String },
  address: { type: String },
  gstin: { type: String },
  state: { type: String },
  country: { type: String },
  pincode: { type: String },
}, { timestamps: true });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
