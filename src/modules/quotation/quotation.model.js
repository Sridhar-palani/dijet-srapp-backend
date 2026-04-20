import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    customer: {
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    quotationNumber: { type: String, unique: true, sparse: true },
    items: [
      {
        itemData: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },  
        quantity: { type: Number, required: true },
        delivery: { type: String },

        listprice: { type: Number, required: true },

        discountPercent: { type: Number, default: 0 },

        unitPrice: { type: Number },
        itemtotal: { type: Number },

        notes: { type: String },
        tax: { type: String },
        hsncode: { type: String },
      },
    ],
    date: { type: String, required: true },
    docDate: { type: Date, index: true },
    paymentTerms: { type: String },
    transportCharges: { type: Number, default: 0 },
    packingCharges: { type: Number, default: 0 },
    enquiryDetails: { type: String },
    remarks: { type: String },

    totalnet: { type: Number, required: true },

    grosstotal: { type: Number, required: true },

    validuntil: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending Approval", "Active", "Converted", "Modified", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

quotationSchema.index({ customer: 1, createdAt: -1 });
quotationSchema.index({ status: 1, createdAt: -1 });

const Quotation = mongoose.model("Quotation", quotationSchema);
export default Quotation;
