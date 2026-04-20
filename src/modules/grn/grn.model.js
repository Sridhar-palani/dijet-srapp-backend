import mongoose from "mongoose";

const grnItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  description: { type: String },
  receivedQty: { type: Number, required: true, min: [1, "Received quantity must be at least 1"] },
  remarks: { type: String },
});

const grnSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, unique: true, sparse: true },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    items: [grnItemSchema],
    receivedDate: { type: String },
    docDate: { type: Date, index: true },
    vendorInvoiceNo: { type: String },
    vendorInvoiceDate: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

grnSchema.index({ poId: 1, createdAt: -1 });

const GRN = mongoose.model("GRN", grnSchema);
export default GRN;
