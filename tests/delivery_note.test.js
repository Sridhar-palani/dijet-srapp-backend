import { describe, it, expect } from "vitest";
import Item from "../src/modules/item/item.model.js";
import Customer from "../src/modules/customer/customer.model.js";
import CustomerPO from "../src/modules/customer_po/customer_po.model.js";
import { createFromCPO, deleteDeliveryNote } from "../src/modules/delivery_note/delivery_note.service.js";

async function seedCustomer() {
  return Customer.create({ name: "Test Customer" });
}

async function seedItem(name, stock) {
  return Item.create({ name, stock });
}

async function seedCPO(customerId, itemId, orderedQty = 10) {
  return CustomerPO.create({
    customer: customerId,
    cpoNumber: `CPO-TEST-${Date.now()}`,
    status: "Confirmed",
    items: [
      {
        itemId,
        description: "Test Item",
        unit: "pcs",
        orderedQty,
        unitPrice: 50,
      },
    ],
  });
}

describe("DeliveryNote from CPO — stock deduction", () => {
  it("deducts stock and updates CPO deliveredQty on create", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Cutter", 20);
    const cpo = await seedCPO(customer._id, item._id, 10);

    await createFromCPO(cpo._id, {
      items: [{ cpoItemId: cpo.items[0]._id, deliveredQty: 6 }],
    });

    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.stock).toBe(14); // 20 - 6

    const updatedCPO = await CustomerPO.findById(cpo._id);
    expect(updatedCPO.items[0].deliveredQty).toBe(6);
    expect(updatedCPO.status).toBe("Partially Delivered");
  });

  it("blocks delivery when stock is insufficient", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Boring Bar", 3);
    const cpo = await seedCPO(customer._id, item._id, 10);

    await expect(
      createFromCPO(cpo._id, {
        items: [{ cpoItemId: cpo.items[0]._id, deliveredQty: 5 }],
      })
    ).rejects.toThrow("Insufficient stock");

    // Stock must be unchanged after failed delivery
    const item2 = await Item.findById(item._id);
    expect(item2.stock).toBe(3);
  });

  it("blocks delivery exceeding pending qty", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Milling Cutter", 50);
    const cpo = await seedCPO(customer._id, item._id, 5);

    await expect(
      createFromCPO(cpo._id, {
        items: [{ cpoItemId: cpo.items[0]._id, deliveredQty: 10 }],
      })
    ).rejects.toThrow("only 5 units pending");
  });

  it("restores stock and reverses CPO deliveredQty on delete", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Face Mill", 15);
    const cpo = await seedCPO(customer._id, item._id, 10);

    const dn = await createFromCPO(cpo._id, {
      items: [{ cpoItemId: cpo.items[0]._id, deliveredQty: 8 }],
    });

    await deleteDeliveryNote(dn._id);

    const updatedItem = await Item.findById(item._id);
    expect(updatedItem.stock).toBe(15); // fully restored

    const updatedCPO = await CustomerPO.findById(cpo._id);
    expect(updatedCPO.items[0].deliveredQty).toBe(0);
    expect(updatedCPO.status).toBe("Confirmed");
  });

  it("blocks delivery for Closed CPO", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Thread Mill", 10);
    const cpo = await seedCPO(customer._id, item._id, 5);
    await CustomerPO.findByIdAndUpdate(cpo._id, { status: "Closed" });

    await expect(
      createFromCPO(cpo._id, {
        items: [{ cpoItemId: cpo.items[0]._id, deliveredQty: 2 }],
      })
    ).rejects.toThrow("Closed CPO");
  });
});
