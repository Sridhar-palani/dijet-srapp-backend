/**
 * One-time migration: convert flat counter keys to FY-keyed format.
 *
 * Before: Counter { _id: "quotation", seq: 15 }
 * After:  Counter { _id: "quotation_24-25", seq: 2  }
 *         Counter { _id: "quotation_25-26", seq: 10 }
 *         Counter { _id: "quotation_26-27", seq: 3  }
 *
 * Run ONCE after deploying the FY counter change:
 *   node src/scripts/migrateFYCounters.js
 *
 * Safe to re-run — uses $setOnInsert so existing FY counters are never overwritten.
 *
 * ASSUMPTION: Counters are seeded from countDocuments() per FY.
 * This is correct only if no documents have been deleted in a given FY.
 * If deletions occurred, the counter will be lower than the highest sequence
 * ever issued, risking number collisions on the next document created.
 * Verify no deletions exist before running, or adjust seq values manually in MongoDB.
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

const fyBoundaries = [
  { fy: "24-25", start: new Date(2024, 3, 1), end: new Date(2025, 3, 1) },
  { fy: "25-26", start: new Date(2025, 3, 1), end: new Date(2026, 3, 1) },
  { fy: "26-27", start: new Date(2026, 3, 1), end: new Date(2027, 3, 1) },
];

const seeds = [
  { name: "quotation", Model: Quotation,     dateField: "docDate" },
  { name: "dn",        Model: DeliveryNote,  dateField: "docDate" },
  { name: "grn",       Model: GRN,           dateField: "docDate" },
  { name: "po",        Model: PurchaseOrder, dateField: "poDate"  },
  { name: "invoice",   Model: Invoice,       dateField: "docDate" },
];

for (const { fy, start, end } of fyBoundaries) {
  for (const { name, Model, dateField } of seeds) {
    const count = await Model.countDocuments({ [dateField]: { $gte: start, $lt: end } });
    if (count === 0) continue;
    const key = `${name}_${fy}`;
    const result = await Counter.findOneAndUpdate(
      { _id: key },
      { $setOnInsert: { seq: count } },
      { upsert: true, new: true }
    );
    console.log(`${key}: ${result.seq === count ? `seeded to ${count}` : `already exists at ${result.seq} (skipped)`}`);
  }
}

// Remove old flat-key counters (no longer used)
const flatKeys = ["quotation", "dn", "grn", "po", "invoice"];
for (const key of flatKeys) {
  const deleted = await Counter.findByIdAndDelete(key);
  if (deleted) console.log(`Deleted old flat counter: "${key}"`);
  else console.log(`Old flat counter "${key}" not found — skipped`);
}

await mongoose.disconnect();
console.log("\nMigration complete.");
