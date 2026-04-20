import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  specification: { type: String, required: true },
  quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
  uom: { type: String, default: "PCS" },
  listRate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  unitRate: { type: Number, required: true },
  total: { type: Number, required: true },
  receivedQty: { type: Number, default: 0 },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true, sparse: true },
    cpoId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPO" },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    billTo: {
      name: { type: String },
      address: { type: String },
      gstin: { type: String },
      pan: { type: String },
      state: { type: String },
      stateCode: { type: String },
    },
    shipTo: {
      address: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    items: [poItemSchema],
    currency: { type: String, default: "INR" },
    exchangeRate: { type: Number, default: 1 },
    vendorQuoteNo: { type: String },
    buyerReqNo: { type: String },
    paymentTerms: { type: String },
    totalAmount: { type: Number, required: true },
    amountInWords: { type: String },
    termsAndConditions: [{ type: String }],
    status: {
      type: String,
      enum: ["Open", "Partially Received", "Closed", "Cancelled"],
      default: "Open",
    },
    poDate: { type: Date, index: true },
    dueDate: { type: String },
    amountPaid: { type: Number, default: 0 },
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        mode: {
          type: String,
          enum: ["Cash", "Cheque", "Bank Transfer", "UPI", "Other"],
          default: "Bank Transfer",
        },
        reference: { type: String },
        notes: { type: String },
        vendorInvoiceNo: { type: String },
      },
    ],
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ vendor: 1, createdAt: -1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ cpoId: 1 });

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
export default PurchaseOrder;
