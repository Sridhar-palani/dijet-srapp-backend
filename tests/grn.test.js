import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Item from "../src/modules/item/item.model.js";
import PurchaseOrder from "../src/modules/purchase_order/purchase_order.model.js";
import Vendor from "../src/modules/vendor/vendor.model.js";
import { createGRN, deleteGRN } from "../src/modules/grn/grn.service.js";

// Helpers to seed minimal test data
async function seedVendor() {
  return Vendor.create({ name: "Test Vendor" });
}

async function seedItem(name = "Test Item", stock = 0) {
  return Item.create({ name, stock });
}

async function seedPO(vendorId, itemId, quantity = 10) {
  return PurchaseOrder.create({
    vendor: vendorId,
    poNumber: `TEST-PO-${Date.now()}`,
    items: [
      {
        itemId,
        specification: "Test spec",
        quantity,
        listRate: 100,
        unitRate: 100,
        total: quantity * 100,
      },
    ],
    totalAmount: quantity * 100,
    status: "Open",
  });
}

describe("GRN — stock increment and PO update", () => {
  it("increments Item.stock and updates PO receivedQty on create", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Drill Bit", 0);
    const po = await seedPO(vendor._id, item._id, 10);

    await createGRN({
      poId: po._id,
      items: [{ itemId: item._id, receivedQty: 5, description: "Drill Bit" }],
    });

    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.stock).toBe(5);

    const updatedPO = await PurchaseOrder.findById(po._id);
    const poItem = updatedPO.items.find((i) => i.itemId?.toString() === item._id.toString());
    expect(poItem.receivedQty).toBe(5);
    expect(updatedPO.status).toBe("Partially Received");
  });

  it("sets PO status to Closed when all qty received", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("End Mill", 0);
    const po = await seedPO(vendor._id, item._id, 10);

    await createGRN({
      poId: po._id,
      items: [{ itemId: item._id, receivedQty: 10, description: "End Mill" }],
    });

    const updatedPO = await PurchaseOrder.findById(po._id);
    expect(updatedPO.status).toBe("Closed");
  });

  it("rejects receivedQty exceeding remaining PO qty", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Tap", 0);
    const po = await seedPO(vendor._id, item._id, 5);

    await expect(
      createGRN({
        poId: po._id,
        items: [{ itemId: item._id, receivedQty: 10, description: "Tap" }],
      })
    ).rejects.toThrow("exceeds remaining qty");
  });

  it("rejects GRN on Cancelled PO", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Reamer", 0);
    const po = await seedPO(vendor._id, item._id, 5);
    await PurchaseOrder.findByIdAndUpdate(po._id, { status: "Cancelled" });

    await expect(
      createGRN({
        poId: po._id,
        items: [{ itemId: item._id, receivedQty: 3, description: "Reamer" }],
      })
    ).rejects.toThrow("Cancelled PO");
  });
});

describe("GRN — stock reversal on delete", () => {
  it("decrements Item.stock and restores PO receivedQty on delete", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Insert", 0);
    const po = await seedPO(vendor._id, item._id, 10);

    const grn = await createGRN({
      poId: po._id,
      items: [{ itemId: item._id, receivedQty: 7, description: "Insert" }],
    });

    await deleteGRN(grn._id);

    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.stock).toBe(0);

    const updatedPO = await PurchaseOrder.findById(po._id);
    const poItem = updatedPO.items.find((i) => i.itemId?.toString() === item._id.toString());
    expect(poItem.receivedQty).toBe(0);
    expect(updatedPO.status).toBe("Open");
  });

  it("blocks delete when stock already consumed by a DN", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Coolant", 0);
    const po = await seedPO(vendor._id, item._id, 10);

    const grn = await createGRN({
      poId: po._id,
      items: [{ itemId: item._id, receivedQty: 5, description: "Coolant" }],
    });

    // Simulate stock being consumed by a DN
    await Item.findByIdAndUpdate(item._id, { $inc: { stock: -5 } });

    await expect(deleteGRN(grn._id)).rejects.toThrow("Stock was already consumed");
  });

  it("blocks delete when PO is Closed", async () => {
    const vendor = await seedVendor();
    const item = await seedItem("Lathe Tool", 0);
    const po = await seedPO(vendor._id, item._id, 5);

    const grn = await createGRN({
      poId: po._id,
      items: [{ itemId: item._id, receivedQty: 5, description: "Lathe Tool" }],
    });

    // PO is now Closed (all received). Deletion should be blocked.
    const updatedPO = await PurchaseOrder.findById(po._id);
    expect(updatedPO.status).toBe("Closed");

    await expect(deleteGRN(grn._id)).rejects.toThrow("already Closed");
  });
});
