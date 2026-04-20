import mongoose from "mongoose";

const cpoItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  description: { type: String, required: true },
  make: { type: String },
  hsnCode: { type: String },
  unit: { type: String, default: "pcs" },
  unitPrice: { type: Number, default: 0 },
  orderedQty: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  deliveredQty: { type: Number, default: 0 },
  invoicedQty: { type: Number, default: 0 },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  requiredDate: { type: String },
  remarks: { type: String },
});

const customerPOSchema = new mongoose.Schema(
  {
    cpoNumber: { type: String, unique: true, sparse: true },
    cpoDate: { type: Date, index: true },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [cpoItemSchema],
    remarks: { type: String },
    status: {
      type: String,
      enum: [
        "Confirmed",
        "Partially Delivered",
        "Delivered",
        "Partially Invoiced",
        "Invoiced",
        "Closed",
      ],
      default: "Confirmed",
    },
  },
  { timestamps: true }
);

customerPOSchema.index({ customer: 1, createdAt: -1 });
customerPOSchema.index({ status: 1, createdAt: -1 });
customerPOSchema.index({ quotationId: 1 });

const CustomerPO = mongoose.model("CustomerPO", customerPOSchema);
export default CustomerPO;
