/**
 * Wipes all business data from the database.
 * Preserves: items, users
 * Clears: customers, vendors, quotations, customerpos, purchaseorders,
 *         grns, deliverynotes, invoices, expenses, investments,
 *         settings, auditlogs, counters
 *
 * Usage: node src/scripts/resetDB.js
 */
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import config from "../config/env.js";

await mongoose.connect(config.mongoUri);

const db = mongoose.connection.db;
const allCollections = (await db.listCollections().toArray()).map((c) => c.name);

// Collections to preserve
const KEEP = new Set(["items", "users"]);

const toClear = allCollections.filter((name) => !KEEP.has(name));

if (toClear.length === 0) {
  console.log("Nothing to clear.");
} else {
  for (const name of toClear) {
    await db.dropCollection(name);
    console.log(`  dropped: ${name}`);
  }
  console.log(`\n✅ Cleared ${toClear.length} collections. Items and users preserved.`);
}

await mongoose.disconnect();
