import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet;

// Global setup — runs once before all test files
// MongoMemoryReplSet is required for MongoDB transaction support
export async function setup() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await replSet.waitUntilRunning();
  process.env.MONGO_URI = replSet.getUri();
}

export async function teardown() {
  await replSet.stop();
}
