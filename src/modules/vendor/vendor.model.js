import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorAccount: { type: String },
    name: { type: String, required: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    gstin: { type: String },
    pan: { type: String },
    state: { type: String },
    stateCode: { type: String },
    paymentTerms: { type: String },
  },
  { timestamps: true }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
