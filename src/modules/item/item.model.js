import mongoose from "mongoose";

// itemType → default HSN code mapping (can be overridden manually)
export const ITEM_TYPE_HSN_MAP = {
  // Milling & Drilling Inserts / Tools
  "Indexable Milling Insert": "82079090",
  "Indexable Drill Insert": "82079090",
  "Solid Carbide Endmill": "82079090",
  "Carbide Shank": "84661010",
  "Gundrill": "82075000",
  "Drill": "82079090",
  "Tap": "82079090",
  "Machine Tap": "82079090",

  // Holders & Machine Attachments
  "Indexable Milling Cutter": "84661010",
  "Mirror Ball / Radius C-Body": "84661010",
  "TA Holder": "84661010",
  "Indexable Drill Holder": "84661010",
  "Modular Head": "84661010",
  "Shrink Fit Collet": "84661010",
  "Tool Holder": "84661010",
  "2 Piece Holder": "84669390",

  // Hardware & Fasteners
  "Spare Parts": "82079090",
  "Screw": "73182990",
  "Nuts": "73181600",

  // Services
  "Regrinding & Recoating": "998898",
};

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    image: { type: String },
    make: { type: String },
    itemType: { type: String, enum: Object.keys(ITEM_TYPE_HSN_MAP) },
    hsnCode: { type: String },
    application: { type: String },
    public_id: { type: String },
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
    listPrice: { type: Number, default: 0 },
    maxDiscountPercent: { type: Number, default: 100, min: 0, max: 100 },
    lastBuyingCost: { type: Number, default: 0 },
    note: { type: String },
    status: {
      type: String,
      enum: ["pending_approval", "active"],
      default: "active",
    },
  },
  { timestamps: true },
);

itemSchema.index({ status: 1, name: 1 });

const Item = mongoose.model("Item", itemSchema);
export default Item;
