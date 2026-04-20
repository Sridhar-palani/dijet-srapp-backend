/**
 * Seeds FY-keyed atomic counters from existing collection counts.
 * Run ONCE before first deploy, or after migrateFYCounters.js for fresh installs.
 *
 * Counts documents per FY (by document date field) and writes FY-keyed counter documents.
 * Safe to re-run — uses $setOnInsert so existing counters are never overwritten.
 *
 *   node src/scripts/seedCounters.js
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import config from "../config/env.js";
import { Counter } from "../utils/counter.js";
import GRN from "../modules/grn/grn.model.js";
import DeliveryNote from "../modules/delivery_note/delivery_note.model.js";
import Quotation from "../modules/quotation/quotation.model.js";
import Invoice from "../modules/invoice/invoice.model.js";
import PurchaseOrder from "../modules/purchase_order/purchase_order.model.js";

await mongoose.connect(config.mongoUri);

// Seed for all FYs that have data — extend this array in future years
const fyBoundaries = [
  { fy: "24-25", start: new Date(2024, 3, 1), end: new Date(2025, 3, 1) },
  { fy: "25-26", start: new Date(2025, 3, 1), end: new Date(2026, 3, 1) },
  { fy: "26-27", start: new Date(2026, 3, 1), end: new Date(2027, 3, 1) },
];

const models = [
  { name: "quotation", Model: Quotation,     dateField: "docDate" },
  { name: "dn",        Model: DeliveryNote,  dateField: "docDate" },
  { name: "grn",       Model: GRN,           dateField: "docDate" },
  { name: "po",        Model: PurchaseOrder, dateField: "poDate"  },
  { name: "invoice",   Model: Invoice,       dateField: "docDate" },
];

for (const { fy, start, end } of fyBoundaries) {
  for (const { name, Model, dateField } of models) {
    const count = await Model.countDocuments({ [dateField]: { $gte: start, $lt: end } });
    if (count === 0) continue; // skip empty FYs
    const key = `${name}_${fy}`;
    const result = await Counter.findOneAndUpdate(
      { _id: key },
      { $setOnInsert: { seq: count } },
      { upsert: true, new: true }
    );
    console.log(`Counter "${key}": ${result.seq === count ? `seeded to ${count}` : `already exists at ${result.seq} (skipped)`}`);
  }
}

await mongoose.disconnect();
console.log("Done.");
