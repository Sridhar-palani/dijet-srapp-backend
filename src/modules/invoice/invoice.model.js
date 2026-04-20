import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  description: { type: String, required: true },
  hsnCode: { type: String },
  quantity: { type: Number, required: true },
  unitRate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  sgst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  cgst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  igst: {
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, sparse: true },
    deliveryNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryNote",
      required: true,
    },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    invoiceDate: { type: String, required: true },
    docDate: { type: Date, index: true },
    billTo: {
      name: { type: String },
      address: { type: String },
      gstin: { type: String },
      stateCode: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    shipTo: {
      name: { type: String },
      address: { type: String },
    },
    buyerOrderNo: { type: String },
    buyerOrderDate: { type: String },
    dispatchDocNo: { type: String },
    eWayBillNo: { type: String },
    deliveryNote: { type: String },
    dispatchedThrough: { type: String },
    paymentTerms: { type: String },
    items: [invoiceItemSchema],
    taxSummary: {
      totalBeforeTax: { type: Number },
      totalSGST: { type: Number, default: 0 },
      totalCGST: { type: Number, default: 0 },
      totalIGST: { type: Number, default: 0 },
      totalTax: { type: Number },
      totalAfterTax: { type: Number },
    },
    termsAndConditions: [{ type: String }],
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled"],
      default: "Draft",
    },
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
      },
    ],
  },
  { timestamps: true }
);

invoiceSchema.index({ customer: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ deliveryNoteId: 1 });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
