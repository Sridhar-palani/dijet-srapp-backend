import mongoose from "mongoose";
import { getFinancialYear } from "../constants/index.js";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model("Counter", counterSchema);

/**
 * Atomically increment and return the next sequence value.
 * Key is scoped to the financial year: "quotation_26-27", "grn_26-27", etc.
 * Each new FY automatically starts from 1 (counter document is created on first use).
 *
 * @param {string} name  - base name e.g. "quotation", "grn", "dn", "po", "invoice"
 * @param {string} [fy]  - FY string e.g. "26-27"; defaults to current FY
 */
export const nextSequence = async (name, fy = getFinancialYear()) => {
  const key = `${name}_${fy}`;
  // Retry handles the rare E11000 race: concurrent upserts on a non-existent key
  // all try to insert — one wins, the rest retry as plain updates.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const doc = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );
      return doc.seq;
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }
};
