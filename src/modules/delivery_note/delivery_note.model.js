import mongoose from "mongoose";

const dnItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  cpoItemId: { type: mongoose.Schema.Types.ObjectId }, // ref to CPO item subdoc
  description: { type: String, required: true },
  hsnCode: { type: String },
  unit: { type: String, default: "pcs" },
  orderedQty: { type: Number, required: true, min: [0, "Ordered quantity cannot be negative"] },
  deliveredQty: { type: Number, required: true, min: [0, "Delivered quantity cannot be negative"] },
  invoicedQty: { type: Number, default: 0 },
  remarks: { type: String },
});

const deliveryNoteSchema = new mongoose.Schema(
  {
    dnNumber: { type: String, unique: true, sparse: true },
    cpoId: { type: mongoose.Schema.Types.ObjectId, ref: "CustomerPO" },
    poId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder" },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [dnItemSchema],
    dispatchedThrough: { type: String },
    vehicleNo: { type: String },
    deliveryDate: { type: String },
    docDate: { type: Date, index: true },
    remarks: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Partially Invoiced", "Invoiced"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

deliveryNoteSchema.index({ customer: 1, createdAt: -1 });
deliveryNoteSchema.index({ status: 1, createdAt: -1 });
deliveryNoteSchema.index({ cpoId: 1 });

const DeliveryNote = mongoose.model("DeliveryNote", deliveryNoteSchema);
export default DeliveryNote;
