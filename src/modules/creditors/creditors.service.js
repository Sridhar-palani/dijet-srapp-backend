import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import AppError from "../../utils/AppError.js";

// All POs with outstanding balance (creditors — what we owe vendors), or settled if settled=true
export const getAllCreditors = async ({ settled = false } = {}) => {
  const pos = await PurchaseOrder.find({
    status: { $nin: ["Cancelled"] },
  })
    .populate("vendor", "name email phone address gstin")
    .sort({ poDate: -1 });

  return pos
    .filter((po) =>
      settled
        ? po.totalAmount > 0 && po.amountPaid >= po.totalAmount
        : po.amountPaid < po.totalAmount
    )
    .map((po) => ({
      _id: po._id,
      poNumber: po.poNumber,
      poDate: po.poDate,
      dueDate: po.dueDate,
      vendor: po.vendor,
      totalAmount: po.totalAmount,
      amountPaid: po.amountPaid,
      balanceDue: parseFloat((po.totalAmount - po.amountPaid).toFixed(2)),
      status: po.status,
      paymentTerms: po.paymentTerms,
      daysOverdue:
        po.dueDate && new Date(po.dueDate) < new Date()
          ? Math.floor((new Date() - new Date(po.dueDate)) / (1000 * 60 * 60 * 24))
          : 0,
    }));
};

// Summary totals for creditors
export const getCreditorsSummary = async () => {
  const pos = await PurchaseOrder.find({
    status: { $nin: ["Cancelled"] },
  });

  const totalOrdered = pos.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalPaid = pos.reduce((sum, po) => sum + po.amountPaid, 0);
  const totalOutstanding = parseFloat((totalOrdered - totalPaid).toFixed(2));

  const overduePos = pos.filter(
    (po) =>
      po.dueDate &&
      new Date(po.dueDate) < new Date() &&
      po.amountPaid < po.totalAmount
  );
  const totalOverdue = overduePos.reduce(
    (sum, po) => sum + (po.totalAmount - po.amountPaid),
    0
  );

  return {
    totalOrdered: parseFloat(totalOrdered.toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalOutstanding,
    totalOverdue: parseFloat(totalOverdue.toFixed(2)),
    overdueCount: overduePos.length,
    totalPOsCount: pos.length,
    fullyPaidCount: pos.filter((po) => po.totalAmount > 0 && po.amountPaid >= po.totalAmount).length,
  };
};

// Record a payment against a PO
export const recordPayment = async (poId, paymentData) => {
  const po = await PurchaseOrder.findById(poId);
  if (!po) throw new AppError("Purchase Order not found", 404);
  if (po.status === "Cancelled") throw new AppError("Cannot record payment for a cancelled Purchase Order", 400);

  const { amount, mode, reference, notes, vendorInvoiceNo } = paymentData;
  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw new AppError("Payment amount must be a valid number greater than 0", 400);
  }

  const newAmountPaid = parseFloat((po.amountPaid + numAmount).toFixed(2));
  if (newAmountPaid > po.totalAmount) {
    throw new AppError(
      `Payment of ₹${numAmount} exceeds balance due of ₹${(po.totalAmount - po.amountPaid).toFixed(2)}`,
      400
    );
  }

  po.payments.push({ amount: numAmount, mode, reference, notes, vendorInvoiceNo });
  po.amountPaid = newAmountPaid;

  return await po.save();
};

// Payment history for a single PO
export const getPOPayments = async (poId) => {
  const po = await PurchaseOrder.findById(poId).populate(
    "vendor",
    "name email phone"
  );
  if (!po) throw new AppError("Purchase Order not found", 404);

  return {
    _id: po._id,
    poNumber: po.poNumber,
    vendor: po.vendor,
    totalAmount: po.totalAmount,
    amountPaid: po.amountPaid,
    balanceDue: parseFloat((po.totalAmount - po.amountPaid).toFixed(2)),
    status: po.status,
    dueDate: po.dueDate,
    payments: po.payments,
  };
};
