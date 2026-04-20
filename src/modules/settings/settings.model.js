import mongoose from "mongoose";

// Singleton — only one document ever exists in this collection
const settingsSchema = new mongoose.Schema(
  {
    openingCash: { type: Number, default: 0, min: [0, "Opening cash cannot be negative"] },
    asOf: { type: String }, // "YYYY-MM-DD" — the date this balance was as of
    notes: { type: String },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
