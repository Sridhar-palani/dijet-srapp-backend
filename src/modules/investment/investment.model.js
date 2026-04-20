import mongoose from "mongoose";

const investmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["Equipment", "Machinery", "Vehicle", "Furniture", "Software", "Land & Building", "Other"],
      required: true,
    },
    amount: { type: Number, required: true, min: [0, "Amount cannot be negative"] },
    purchaseDate: { type: String, required: true },
    description: { type: String },
    vendor: { type: String },
    depreciationRate: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ["Active", "Disposed", "Under Maintenance"],
      default: "Active",
    },
    referenceNo: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

const Investment = mongoose.model("Investment", investmentSchema);
export default Investment;
