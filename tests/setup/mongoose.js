import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach } from "vitest";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Drop all collections, then recreate them with indexes so the catalog is stable
  // before any test runs transactions. Without recreate, the first transaction on a
  // freshly-created collection fails with "catalog changes" (WiredTiger DDL race).
  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();
  for (const { name } of existing) {
    await db.dropCollection(name).catch(() => {});
  }
  for (const model of Object.values(mongoose.connection.models)) {
    await model.createCollection().catch(() => {});
    await model.syncIndexes().catch(() => {});
  }
});
