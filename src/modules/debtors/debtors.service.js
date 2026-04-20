import Invoice from "../invoice/invoice.model.js";
import AppError from "../../utils/AppError.js";

const resolveStatus = (amountPaid, totalAfterTax, dueDate) => {
  if (amountPaid >= totalAfterTax) return "Paid";
  if (amountPaid > 0) return "Partially Paid";
  if (dueDate && new Date(dueDate) < new Date()) return "Overdue";
  return "Sent";
};

// All invoices that have outstanding balance (debtors), or settled if settled=true
export const getAllDebtors = async ({ settled = false } = {}) => {
  const filter = settled
    ? { status: "Paid" }
    : { status: { $in: ["Draft", "Sent", "Partially Paid", "Overdue"] } };

  const invoices = await Invoice.find(filter)
    .populate("customer", "name email phone address gstin state")
    .sort({ docDate: -1 });

  return invoices.map((inv) => ({
    _id: inv._id,
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    customer: inv.customer,
    totalAmount: inv.taxSummary?.totalAfterTax || 0,
    amountPaid: inv.amountPaid,
    balanceDue: parseFloat(
      ((inv.taxSummary?.totalAfterTax || 0) - inv.amountPaid).toFixed(2)
    ),
    status: inv.status,
    daysOverdue:
      inv.dueDate && new Date(inv.dueDate) < new Date()
        ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
        : 0,
  }));
};

// Summary totals for debtors
export const getDebtorsSummary = async () => {
  const invoices = await Invoice.find({ status: { $ne: "Cancelled" } });

  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + (inv.taxSummary?.totalAfterTax || 0),
    0
  );
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = parseFloat((totalInvoiced - totalCollected).toFixed(2));

  const overdueInvoices = invoices.filter(
    (inv) =>
      inv.dueDate &&
      new Date(inv.dueDate) < new Date() &&
      inv.status !== "Paid"
  );
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + ((inv.taxSummary?.totalAfterTax || 0) - inv.amountPaid),
    0
  );

  return {
    totalInvoiced: parseFloat(totalInvoiced.toFixed(2)),
    totalCollected: parseFloat(totalCollected.toFixed(2)),
    totalOutstanding,
    totalOverdue: parseFloat(totalOverdue.toFixed(2)),
    overdueCount: overdueInvoices.length,
    totalInvoicesCount: invoices.length,
    paidCount: invoices.filter((inv) => inv.status === "Paid" && inv.amountPaid > 0).length,
  };
};

// Record a payment against an invoice
export const recordPayment = async (invoiceId, paymentData) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new AppError("Invoice not found", 404);
  if (invoice.status === "Paid") throw new AppError("Invoice is already fully paid", 400);

  const { amount, mode, reference, notes } = paymentData;
  const numAmount = Number(amount);
  if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
    throw new AppError("Payment amount must be a valid number greater than 0", 400);
  }

  const totalAfterTax = invoice.taxSummary?.totalAfterTax || 0;
  const newAmountPaid = parseFloat((invoice.amountPaid + numAmount).toFixed(2));

  if (newAmountPaid > totalAfterTax) {
    throw new AppError(
      `Payment of ₹${numAmount} exceeds balance due of ₹${(totalAfterTax - invoice.amountPaid).toFixed(2)}`,
      400
    );
  }

  invoice.payments.push({ amount: numAmount, mode, reference, notes });
  invoice.amountPaid = newAmountPaid;
  invoice.status = resolveStatus(newAmountPaid, totalAfterTax, invoice.dueDate);

  return await invoice.save();
};

// Payment history for a single invoice
export const getInvoicePayments = async (invoiceId) => {
  const invoice = await Invoice.findById(invoiceId).populate(
    "customer",
    "name email phone"
  );
  if (!invoice) throw new AppError("Invoice not found", 404);

  return {
    _id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    customer: invoice.customer,
    totalAmount: invoice.taxSummary?.totalAfterTax || 0,
    amountPaid: invoice.amountPaid,
    balanceDue: parseFloat(
      ((invoice.taxSummary?.totalAfterTax || 0) - invoice.amountPaid).toFixed(2)
    ),
    status: invoice.status,
    dueDate: invoice.dueDate,
    payments: invoice.payments,
  };
};
