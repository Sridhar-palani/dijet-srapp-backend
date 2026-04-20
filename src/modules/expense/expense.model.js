import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["Salary", "Rent", "Utilities", "Transport", "Maintenance", "Other"],
      required: true,
    },
    amount: { type: Number, required: true, min: [0, "Amount cannot be negative"] },
    description: { type: String, required: true },
    expenseDate: { type: String, required: true },
    docDate: { type: Date, index: true },
    paidTo: { type: String },
    referenceNo: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1, createdAt: -1 });
expenseSchema.index({ createdAt: -1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
