import { describe, it, expect } from "vitest";
import Item from "../src/modules/item/item.model.js";
import Customer from "../src/modules/customer/customer.model.js";
import CustomerPO from "../src/modules/customer_po/customer_po.model.js";
import DeliveryNote from "../src/modules/delivery_note/delivery_note.model.js";
import Invoice from "../src/modules/invoice/invoice.model.js";
import { createFromCPO } from "../src/modules/delivery_note/delivery_note.service.js";
import { createFromChallan, deleteInvoice } from "../src/modules/invoice/invoice.service.js";

async function seedCustomer(state = "Tamil Nadu") {
  return Customer.create({ name: "Test Customer", state });
}

async function seedItem(name, stock = 50) {
  return Item.create({ name, stock });
}

async function seedCPO(customerId, items) {
  return CustomerPO.create({
    customer: customerId,
    cpoNumber: `CPO-INV-${Date.now()}`,
    status: "Confirmed",
    items,
  });
}

// Creates a DN from CPO and returns both DN and CPO
async function createDN(cpoId, deliveries) {
  const dn = await createFromCPO(cpoId, { items: deliveries });
  const cpo = await CustomerPO.findById(cpoId);
  return { dn, cpo };
}

describe("Invoice — partial invoicing", () => {
  it("invoices all pending items when itemQty is omitted", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Drill", 20);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Drill", unit: "pcs", orderedQty: 10, unitPrice: 100 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 8 },
    ]);

    const invoice = await createFromChallan(dn._id, {});

    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0].quantity).toBe(8);

    const updatedDN = await DeliveryNote.findById(dn._id);
    expect(updatedDN.items[0].invoicedQty).toBe(8);
    expect(updatedDN.status).toBe("Invoiced");

    const updatedCPO = await CustomerPO.findById(cpo._id);
    expect(updatedCPO.items[0].invoicedQty).toBe(8);
  });

  it("invoices only specified quantities (partial)", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Tap", 30);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Tap", unit: "pcs", orderedQty: 10, unitPrice: 80 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 10 },
    ]);

    // Invoice only 4 of the 10 delivered
    const invoice = await createFromChallan(dn._id, {
      itemQty: { [dn.items[0]._id.toString()]: 4 },
    });

    expect(invoice.items[0].quantity).toBe(4);

    const updatedDN = await DeliveryNote.findById(dn._id);
    expect(updatedDN.items[0].invoicedQty).toBe(4);
    expect(updatedDN.status).toBe("Partially Invoiced");

    // Invoice the remaining 6
    const invoice2 = await createFromChallan(dn._id, {
      itemQty: { [dn.items[0]._id.toString()]: 6 },
    });
    expect(invoice2.items[0].quantity).toBe(6);

    const finalDN = await DeliveryNote.findById(dn._id);
    expect(finalDN.items[0].invoicedQty).toBe(10);
    expect(finalDN.status).toBe("Invoiced");
  });

  it("blocks invoicing qty exceeding pending", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Reamer", 20);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Reamer", unit: "pcs", orderedQty: 10, unitPrice: 60 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 5 },
    ]);

    await expect(
      createFromChallan(dn._id, {
        itemQty: { [dn.items[0]._id.toString()]: 10 },
      })
    ).rejects.toThrow("only 5 pending");
  });

  it("blocks invoicing a fully invoiced DN", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("End Mill", 10);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "End Mill", unit: "pcs", orderedQty: 5, unitPrice: 120 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 5 },
    ]);

    await createFromChallan(dn._id, {});

    await expect(createFromChallan(dn._id, {})).rejects.toThrow("already fully invoiced");
  });

  it("reverses DN and CPO invoicedQty on invoice delete", async () => {
    const customer = await seedCustomer();
    const item = await seedItem("Boring Tool", 20);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Boring Tool", unit: "pcs", orderedQty: 8, unitPrice: 200 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 8 },
    ]);

    const invoice = await createFromChallan(dn._id, {});

    await deleteInvoice(invoice._id);

    const updatedDN = await DeliveryNote.findById(dn._id);
    expect(updatedDN.items[0].invoicedQty).toBe(0);
    expect(updatedDN.status).toBe("Pending");

    const updatedCPO = await CustomerPO.findById(cpo._id);
    expect(updatedCPO.items[0].invoicedQty).toBe(0);
  });

  it("applies SGST+CGST for same-state buyer (Tamil Nadu)", async () => {
    const customer = await seedCustomer("Tamil Nadu");
    const item = await seedItem("Insert TN", 10);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Insert TN", unit: "pcs", orderedQty: 2, unitPrice: 500 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 2 },
    ]);

    const invoice = await createFromChallan(dn._id, {});

    expect(invoice.items[0].sgst.rate).toBeGreaterThan(0);
    expect(invoice.items[0].cgst.rate).toBeGreaterThan(0);
    expect(invoice.items[0].igst.rate).toBe(0);
  });

  it("applies IGST for inter-state buyer", async () => {
    const customer = await seedCustomer("Maharashtra");
    const item = await seedItem("Insert MH", 10);
    const cpo = await seedCPO(customer._id, [
      { itemId: item._id, description: "Insert MH", unit: "pcs", orderedQty: 2, unitPrice: 500 },
    ]);

    const { dn } = await createDN(cpo._id, [
      { cpoItemId: cpo.items[0]._id, deliveredQty: 2 },
    ]);

    const invoice = await createFromChallan(dn._id, {});

    expect(invoice.items[0].igst.rate).toBeGreaterThan(0);
    expect(invoice.items[0].sgst.rate).toBe(0);
    expect(invoice.items[0].cgst.rate).toBe(0);
  });
});
