import Invoice from "../invoice/invoice.model.js";
import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import Quotation from "../quotation/quotation.model.js";
import CustomerPO from "../customer_po/customer_po.model.js";
import DeliveryNote from "../delivery_note/delivery_note.model.js";
import Item from "../item/item.model.js";
import Expense from "../expense/expense.model.js";
import Investment from "../investment/investment.model.js";
import Settings from "../settings/settings.model.js";
import GRN from "../grn/grn.model.js";

const round = (n) => parseFloat(n.toFixed(2));
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ── Dashboard — aggregated overview, no full collection scans ─────────────────
export const getDashboard = async () => {
  const [invoiceAgg, poAgg, quotStatusAgg, cpoStatusAgg, dnStatusAgg, settings] =
    await Promise.all([
      // Invoice: totals + status counts in one pass
      Invoice.aggregate([
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: "$taxSummary.totalAfterTax" },
            totalCollected: { $sum: "$amountPaid" },
            total: { $sum: 1 },
            unpaid: { $sum: { $cond: [{ $ne: ["$status", "Paid"] }, 1, 0] } },
            paid: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] } },
            overdue: { $sum: { $cond: [{ $eq: ["$status", "Overdue"] }, 1, 0] } },
          },
        },
      ]),
      // PO: totals + status counts in one pass (excludes Cancelled)
      PurchaseOrder.aggregate([
        { $match: { status: { $nin: ["Cancelled"] } } },
        {
          $group: {
            _id: null,
            totalPOValue: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$amountPaid" },
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] } },
            partiallyReceived: {
              $sum: { $cond: [{ $eq: ["$status", "Partially Received"] }, 1, 0] },
            },
            closed: { $sum: { $cond: [{ $eq: ["$status", "Closed"] }, 1, 0] } },
          },
        },
      ]),
      Quotation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      CustomerPO.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      DeliveryNote.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Settings.findOne().lean(),
    ]);

  const inv = invoiceAgg[0] || {
    totalInvoiced: 0, totalCollected: 0, total: 0, unpaid: 0, paid: 0, overdue: 0,
  };
  const po = poAgg[0] || {
    totalPOValue: 0, totalPaid: 0, total: 0, open: 0, partiallyReceived: 0, closed: 0,
  };

  const quotCounts = Object.fromEntries(quotStatusAgg.map((r) => [r._id, r.count]));
  const cpoCounts = Object.fromEntries(cpoStatusAgg.map((r) => [r._id, r.count]));
  const dnCounts = Object.fromEntries(dnStatusAgg.map((r) => [r._id, r.count]));
  const quotTotal = quotStatusAgg.reduce((s, r) => s + r.count, 0);
  const cpoTotal = cpoStatusAgg.reduce((s, r) => s + r.count, 0);
  const dnTotal = dnStatusAgg.reduce((s, r) => s + r.count, 0);

  const openingCash = settings?.openingCash || 0;
  const totalInvoiced = inv.totalInvoiced || 0;
  const totalCollected = inv.totalCollected || 0;
  const totalPOValue = po.totalPOValue || 0;
  const totalPaid = po.totalPaid || 0;

  return {
    receivables: {
      totalInvoiced: round(totalInvoiced),
      totalCollected: round(totalCollected),
      totalOutstanding: round(totalInvoiced - totalCollected),
    },
    payables: {
      totalOrdered: round(totalPOValue),
      totalPaid: round(totalPaid),
      totalOutstanding: round(totalPOValue - totalPaid),
    },
    profitEstimate: {
      grossProfit: round(totalInvoiced - totalPOValue),
      netCashflow: round(totalCollected - totalPaid),
    },
    cashPosition: {
      openingCash: round(openingCash),
      cashIn: round(totalCollected),
      cashOut: round(totalPaid),
      currentBalance: round(openingCash + totalCollected - totalPaid),
    },
    pipeline: {
      quotations: {
        total: quotTotal,
        pendingApproval: quotCounts["Pending Approval"] || 0,
        active: quotCounts["Active"] || 0,
        converted: quotCounts["Converted"] || 0,
      },
      customerPOs: {
        total: cpoTotal,
        active: (cpoCounts["Confirmed"] || 0) + (cpoCounts["Partially Delivered"] || 0),
        delivered: cpoCounts["Delivered"] || 0,
        invoiced: (cpoCounts["Invoiced"] || 0) + (cpoCounts["Closed"] || 0),
      },
      purchaseOrders: {
        total: po.total,
        open: po.open,
        partiallyReceived: po.partiallyReceived,
        closed: po.closed,
      },
      deliveryNotes: {
        total: dnTotal,
        pending: dnCounts["Pending"] || 0,
        partiallyInvoiced: dnCounts["Partially Invoiced"] || 0,
        invoiced: dnCounts["Invoiced"] || 0,
      },
      invoices: {
        total: inv.total,
        unpaid: inv.unpaid,
        paid: inv.paid,
        overdue: inv.overdue,
      },
    },
  };
};

// ── Monthly sales — date-range $match + $group by month ───────────────────────
// Indian financial year months: Apr→Mar (1-indexed calendar months)
const FY_MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export const getMonthlySales = async (year) => {
  // year=2026 → FY 2025-26 → Apr 2025 – Mar 2026
  const targetYear = Number(year) || new Date().getFullYear();
  const startDate = new Date(targetYear - 1, 3, 1); // Apr 1 of previous year
  const endDate = new Date(targetYear, 3, 1);         // Apr 1 of targetYear (exclusive)

  const rows = await Invoice.aggregate([
    { $match: { docDate: { $gte: startDate, $lt: endDate } } },
    {
      $group: {
        _id: { $month: "$docDate" },
        invoiced: { $sum: "$taxSummary.totalAfterTax" },
        collected: { $sum: "$amountPaid" },
        invoiceCount: { $sum: 1 },
      },
    },
  ]);

  const byMonth = Object.fromEntries(rows.map((r) => [r._id, r]));

  const monthly = FY_MONTHS.map((m) => {
    const calYear = m >= 4 ? targetYear - 1 : targetYear;
    const data = byMonth[m] || { invoiced: 0, collected: 0, invoiceCount: 0 };
    const invoiced = round(data.invoiced);
    const collected = round(data.collected);
    return {
      month: m,
      monthName: new Date(calYear, m - 1, 1).toLocaleString("en-IN", { month: "short" }),
      invoiced,
      collected,
      outstanding: round(invoiced - collected),
      invoiceCount: data.invoiceCount,
    };
  });

  return { year: targetYear, monthly };
};

// ── Top customers — $group + $lookup, no full collection scan ─────────────────
export const getTopCustomers = async (limit = 10) => {
  const rows = await Invoice.aggregate([
    {
      $group: {
        _id: "$customer",
        totalInvoiced: { $sum: "$taxSummary.totalAfterTax" },
        totalCollected: { $sum: "$amountPaid" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { totalInvoiced: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerDoc",
      },
    },
    { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
  ]);

  return rows.map((r) => ({
    customer: r.customerDoc
      ? { _id: r.customerDoc._id, name: r.customerDoc.name, email: r.customerDoc.email }
      : null,
    totalInvoiced: round(r.totalInvoiced),
    totalCollected: round(r.totalCollected),
    outstanding: round(r.totalInvoiced - r.totalCollected),
    invoiceCount: r.invoiceCount,
  }));
};

// ── Top vendors — $group + $lookup, no full collection scan ───────────────────
export const getTopVendors = async (limit = 10) => {
  const rows = await PurchaseOrder.aggregate([
    { $match: { status: { $nin: ["Cancelled"] } } },
    {
      $group: {
        _id: "$vendor",
        totalOrdered: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$amountPaid" },
        poCount: { $sum: 1 },
      },
    },
    { $sort: { totalOrdered: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "vendors",
        localField: "_id",
        foreignField: "_id",
        as: "vendorDoc",
      },
    },
    { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: true } },
  ]);

  return rows.map((r) => ({
    vendor: r.vendorDoc
      ? { _id: r.vendorDoc._id, name: r.vendorDoc.name, email: r.vendorDoc.email }
      : null,
    totalOrdered: round(r.totalOrdered),
    totalPaid: round(r.totalPaid),
    outstanding: round(r.totalOrdered - r.totalPaid),
    poCount: r.poCount,
  }));
};

// ── Stock report — unchanged (Item collection is typically small) ─────────────
export const getStockReport = async () => {
  const items = await Item.find().sort({ name: 1 }).lean();
  return items.map((item) => ({
    _id: item._id,
    name: item.name,
    make: item.make,
    hsnCode: item.hsnCode,
    stock: item.stock || 0,
  }));
};

// ── Profit & Loss — 3 date-scoped aggregations + JS depreciation ──────────────
export const getProfitLossReport = async (year) => {
  // year=2026 → FY 2025-26 → Apr 2025 – Mar 2026
  const targetYear = Number(year) || new Date().getFullYear();
  const startDate = new Date(targetYear - 1, 3, 1); // Apr 1 of previous year
  const endDate = new Date(targetYear, 3, 1);         // Apr 1 of targetYear (exclusive)
  const categories = ["Salary", "Rent", "Utilities", "Transport", "Maintenance", "Other"];

  const [invoiceRows, poRows, expenseRows, investments] = await Promise.all([
    Invoice.aggregate([
      { $match: { docDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: { $month: "$docDate" },
          revenue: { $sum: "$taxSummary.totalBeforeTax" },
          gstCollected: {
            $sum: {
              $add: [
                { $ifNull: ["$taxSummary.totalSGST", 0] },
                { $ifNull: ["$taxSummary.totalCGST", 0] },
                { $ifNull: ["$taxSummary.totalIGST", 0] },
              ],
            },
          },
          cashCollected: { $sum: "$amountPaid" },
        },
      },
    ]),
    PurchaseOrder.aggregate([
      { $match: { status: { $nin: ["Cancelled"] }, poDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: { $month: "$poDate" },
          costOfGoods: { $sum: "$totalAmount" },
          cashPaid: { $sum: "$amountPaid" },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { docDate: { $gte: startDate, $lt: endDate } } },
      {
        $group: {
          _id: { month: { $month: "$docDate" }, category: "$category" },
          amount: { $sum: "$amount" },
        },
      },
    ]),
    Investment.find({ status: "Active", depreciationRate: { $gt: 0 } }).lean(),
  ]);

  // Build lookup maps
  const invByMonth = Object.fromEntries(invoiceRows.map((r) => [r._id, r]));
  const poByMonth = Object.fromEntries(poRows.map((r) => [r._id, r]));

  // Group expenses by month → { total, breakdown }
  const expByMonth = {};
  for (const row of expenseRows) {
    const { month, category } = row._id;
    if (!expByMonth[month]) expByMonth[month] = { total: 0, breakdown: {} };
    expByMonth[month].breakdown[category] = (expByMonth[month].breakdown[category] || 0) + row.amount;
    expByMonth[month].total += row.amount;
  }

  const months = FY_MONTHS.map((m) => {
    const calYear = m >= 4 ? targetYear - 1 : targetYear;
    const invData = invByMonth[m] || { revenue: 0, gstCollected: 0, cashCollected: 0 };
    const poData = poByMonth[m] || { costOfGoods: 0, cashPaid: 0 };
    const expData = expByMonth[m] || { total: 0, breakdown: {} };

    const revenue = invData.revenue || 0;
    const costOfGoods = poData.costOfGoods || 0;
    const expenses = expData.total || 0;
    const cashCollected = invData.cashCollected || 0;
    const cashPaid = poData.cashPaid || 0;

    const expenseBreakdown = {};
    for (const cat of categories) {
      expenseBreakdown[cat] = round(expData.breakdown[cat] || 0);
    }

    return {
      month: m,
      monthName: new Date(calYear, m - 1, 1).toLocaleString("en-IN", { month: "short" }),
      revenue: round(revenue),
      costOfGoods: round(costOfGoods),
      grossProfit: round(revenue - costOfGoods),
      expenses: round(expenses),
      expenseBreakdown,
      depreciation: 0, // filled below
      netProfit: 0,    // filled below
      gstCollected: round(invData.gstCollected || 0),
      cashCollected: round(cashCollected),
      cashPaid: round(cashPaid),
      netCashflow: round(cashCollected - cashPaid - expenses),
      outstandingReceivable: round(revenue - cashCollected),
      outstandingPayable: round(costOfGoods - cashPaid),
    };
  });

  // Depreciation: month-by-month allocation (FY-aware month end dates)
  for (const inv of investments) {
    const purchaseDate = new Date(inv.purchaseDate);
    const monthlyDep = (inv.amount * inv.depreciationRate) / 100 / 12;
    for (let i = 0; i < 12; i++) {
      const fyMonth = FY_MONTHS[i]; // 1-indexed calendar month
      const calYear = fyMonth >= 4 ? targetYear - 1 : targetYear;
      const monthEnd = new Date(calYear, fyMonth, 0); // last day of this FY month
      if (purchaseDate <= monthEnd) {
        months[i].depreciation += monthlyDep;
      }
    }
  }

  for (const m of months) {
    m.depreciation = round(m.depreciation);
    m.netProfit = round(m.grossProfit - m.expenses - m.depreciation);
  }

  // Annual summary
  const summary = {
    revenue: 0, costOfGoods: 0, grossProfit: 0,
    expenses: 0, expenseBreakdown: Object.fromEntries(categories.map((c) => [c, 0])),
    depreciation: 0, netProfit: 0, gstCollected: 0,
    cashCollected: 0, cashPaid: 0, netCashflow: 0,
    outstandingReceivable: 0, outstandingPayable: 0,
  };

  for (const m of months) {
    summary.revenue += m.revenue;
    summary.costOfGoods += m.costOfGoods;
    summary.expenses += m.expenses;
    summary.depreciation += m.depreciation;
    summary.gstCollected += m.gstCollected;
    summary.cashCollected += m.cashCollected;
    summary.cashPaid += m.cashPaid;
    for (const cat of categories) {
      summary.expenseBreakdown[cat] = round(summary.expenseBreakdown[cat] + m.expenseBreakdown[cat]);
    }
  }

  summary.grossProfit = round(summary.revenue - summary.costOfGoods);
  summary.depreciation = round(summary.depreciation);
  summary.netProfit = round(summary.grossProfit - summary.expenses - summary.depreciation);
  summary.netCashflow = round(summary.cashCollected - summary.cashPaid - summary.expenses);
  summary.outstandingReceivable = round(summary.revenue - summary.cashCollected);
  summary.outstandingPayable = round(summary.costOfGoods - summary.cashPaid);
  summary.revenue = round(summary.revenue);
  summary.costOfGoods = round(summary.costOfGoods);
  summary.expenses = round(summary.expenses);
  summary.gstCollected = round(summary.gstCollected);
  summary.cashCollected = round(summary.cashCollected);
  summary.cashPaid = round(summary.cashPaid);

  return { year: targetYear, summary, monthly: months };
};

// ── DC pending — already filtered by status, no change needed ─────────────────
export const getDCPendingReport = async () => {
  const deliveryNotes = await DeliveryNote.find({
    status: { $in: ["Pending", "Partially Invoiced"] },
  })
    .populate("customer", "name email")
    .populate("cpoId", "cpoNumber")
    .populate("items.itemId", "name make")
    .sort({ docDate: -1 });

  return deliveryNotes.map((dn) => {
    const obj = dn.toObject();
    const items = obj.items.map((item) => ({
      ...item,
      pendingInvoiceQty: item.deliveredQty - (item.invoicedQty || 0),
    }));
    return {
      _id: obj._id,
      dnNumber: obj.dnNumber,
      customer: obj.customer,
      cpoNumber: obj.cpoId?.cpoNumber || null,
      deliveryDate: obj.deliveryDate,
      status: obj.status,
      items,
    };
  });
};

// ── Pending CPOs — already filtered by status, no change needed ───────────────
export const getPendingReport = async () => {
  const cpos = await CustomerPO.find({
    status: { $nin: ["Closed"] },
  })
    .populate("customer", "name email")
    .populate("items.itemId", "name make")
    .sort({ cpoDate: -1 });

  return cpos
    .map((cpo) => {
      const obj = cpo.toObject();
      const itemsWithPending = obj.items.map((item) => ({
        ...item,
        pendingDeliveryQty: item.orderedQty - (item.deliveredQty || 0),
        pendingInvoiceQty: (item.deliveredQty || 0) - (item.invoicedQty || 0),
      }));
      const hasPendingDelivery = itemsWithPending.some((i) => i.pendingDeliveryQty > 0);
      const hasPendingInvoice = itemsWithPending.some((i) => i.pendingInvoiceQty > 0);
      return {
        _id: obj._id,
        cpoNumber: obj.cpoNumber,
        customer: obj.customer,
        status: obj.status,
        createdAt: obj.createdAt,
        items: itemsWithPending,
        hasPendingDelivery,
        hasPendingInvoice,
      };
    })
    .filter((c) => c.hasPendingDelivery || c.hasPendingInvoice);
};

// ── Debtor aging — filtered to unpaid invoices, add .lean() for speed ─────────
export const getDebtorAgingReport = async () => {
  const invoices = await Invoice.find({ status: { $nin: ["Paid"] } })
    .populate("customer", "name email phone")
    .select("customer invoiceNumber invoiceDate taxSummary amountPaid docDate status")
    .lean();

  const today = new Date();
  const customerMap = {};

  for (const inv of invoices) {
    const outstanding = (inv.taxSummary?.totalAfterTax || 0) - (inv.amountPaid || 0);
    if (outstanding <= 0) continue;

    const days = Math.floor((today - new Date(inv.docDate || inv.createdAt)) / MS_PER_DAY);
    const bucket = days <= 30 ? "current" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";

    const customerId = inv.customer?._id?.toString();
    if (!customerMap[customerId]) {
      customerMap[customerId] = {
        customer: inv.customer,
        current: 0, "31-60": 0, "61-90": 0, "90+": 0,
        totalOutstanding: 0,
        invoices: [],
      };
    }
    customerMap[customerId][bucket] = round(customerMap[customerId][bucket] + outstanding);
    customerMap[customerId].totalOutstanding = round(customerMap[customerId].totalOutstanding + outstanding);
    customerMap[customerId].invoices.push({
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.taxSummary?.totalAfterTax || 0,
      amountPaid: inv.amountPaid || 0,
      outstanding: round(outstanding),
      daysOutstanding: days,
      bucket,
    });
  }

  const summary = { current: 0, "31-60": 0, "61-90": 0, "90+": 0, totalOutstanding: 0 };
  const customers = Object.values(customerMap).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  customers.forEach((c) => {
    summary.current = round(summary.current + c.current);
    summary["31-60"] = round(summary["31-60"] + c["31-60"]);
    summary["61-90"] = round(summary["61-90"] + c["61-90"]);
    summary["90+"] = round(summary["90+"] + c["90+"]);
    summary.totalOutstanding = round(summary.totalOutstanding + c.totalOutstanding);
  });

  return { summary, customers };
};

// ── Item sales — $unwind + $group + $lookup, avoids full populate ─────────────
export const getItemSalesReport = async (year) => {
  const targetYear = year ? Number(year) : null;

  const pipeline = [
    ...(targetYear
      ? [{ $match: { docDate: { $gte: new Date(targetYear - 1, 3, 1), $lt: new Date(targetYear, 3, 1) } } }]
      : []),
    { $unwind: "$items" },
    {
      $group: {
        _id: { itemId: "$items.itemId", description: "$items.description" },
        totalQtySold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.taxableAmount" },
        totalSGST: { $sum: "$items.sgst.amount" },
        totalCGST: { $sum: "$items.cgst.amount" },
        totalIGST: { $sum: "$items.igst.amount" },
        invoiceCount: { $sum: 1 },
        hsnCode: { $first: "$items.hsnCode" },
      },
    },
    {
      $lookup: {
        from: "items",
        localField: "_id.itemId",
        foreignField: "_id",
        as: "itemDoc",
      },
    },
    { $unwind: { path: "$itemDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { totalRevenue: -1 } },
  ];

  const rows = await Invoice.aggregate(pipeline);

  return rows.map((r) => {
    const tax = (r.totalSGST || 0) + (r.totalCGST || 0) + (r.totalIGST || 0);
    return {
      itemId: r._id.itemId || null,
      name: r.itemDoc?.name || r._id.description,
      make: r.itemDoc?.make || "-",
      hsnCode: r.itemDoc?.hsnCode || r.hsnCode || "-",
      totalQtySold: r.totalQtySold,
      totalRevenue: round(r.totalRevenue),
      totalTax: round(tax),
      totalWithTax: round(r.totalRevenue + tax),
      invoiceCount: r.invoiceCount,
    };
  });
};

// ── Vendor performance — aggregated GRN first dates + PO $lookup ──────────────
export const getVendorPerformanceReport = async () => {
  const [grnFirstDates, pos] = await Promise.all([
    // Get the earliest GRN date per PO — avoids loading all GRN documents
    GRN.aggregate([
      { $group: { _id: "$poId", firstGRNDate: { $min: "$docDate" } } },
    ]),
    // PO stats + vendor join
    PurchaseOrder.aggregate([
      { $match: { status: { $nin: ["Cancelled"] } } },
      {
        $lookup: {
          from: "vendors",
          localField: "vendor",
          foreignField: "_id",
          as: "vendorDoc",
        },
      },
      { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          poDate: 1,
          status: 1,
          totalAmount: 1,
          vendor: "$vendorDoc",
          orderedTotal: { $sum: "$items.quantity" },
          receivedTotal: { $sum: "$items.receivedQty" },
        },
      },
    ]),
  ]);

  const grnDateByPO = Object.fromEntries(
    grnFirstDates.map((r) => [r._id.toString(), r.firstGRNDate])
  );

  const vendorMap = {};
  for (const po of pos) {
    const vendorId = po.vendor?._id?.toString();
    if (!vendorId) continue;
    if (!vendorMap[vendorId]) {
      vendorMap[vendorId] = {
        vendor: po.vendor,
        totalOrdered: 0,
        totalReceived: 0,
        totalPOValue: 0,
        poCount: 0,
        fullyReceivedCount: 0,
        deliveryDays: [],
      };
    }

    vendorMap[vendorId].totalOrdered += po.orderedTotal || 0;
    vendorMap[vendorId].totalReceived += po.receivedTotal || 0;
    vendorMap[vendorId].totalPOValue += po.totalAmount || 0;
    vendorMap[vendorId].poCount += 1;
    if (po.status === "Closed") vendorMap[vendorId].fullyReceivedCount += 1;

    const firstGRNDate = grnDateByPO[po._id.toString()];
    if (firstGRNDate) {
      const days = Math.floor((new Date(firstGRNDate) - new Date(po.poDate || po.createdAt)) / MS_PER_DAY);
      if (days >= 0) vendorMap[vendorId].deliveryDays.push(days);
    }
  }

  return Object.values(vendorMap)
    .map((v) => ({
      vendor: v.vendor,
      poCount: v.poCount,
      fullyReceivedCount: v.fullyReceivedCount,
      totalPOValue: round(v.totalPOValue),
      totalOrdered: v.totalOrdered,
      totalReceived: v.totalReceived,
      fulfillmentRate:
        v.totalOrdered > 0 ? round((v.totalReceived / v.totalOrdered) * 100) : 0,
      avgDeliveryDays:
        v.deliveryDays.length > 0
          ? Math.round(v.deliveryDays.reduce((s, d) => s + d, 0) / v.deliveryDays.length)
          : null,
    }))
    .sort((a, b) => b.totalPOValue - a.totalPOValue);
};

// ── Customer payment behaviour — aggregation + targeted paid invoice fetch ─────
export const getCustomerPaymentBehaviourReport = async () => {
  // Phase 1: aggregate bulk stats (one DB scan)
  const statsRows = await Invoice.aggregate([
    {
      $group: {
        _id: "$customer",
        totalInvoiced: { $sum: "$taxSummary.totalAfterTax" },
        totalPaid: { $sum: "$amountPaid" },
        invoiceCount: { $sum: 1 },
        paidInvoiceCount: { $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerDoc",
      },
    },
    { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { totalInvoiced: -1 } },
  ]);

  // Phase 2: load only paid invoices for avgDaysToPay (much smaller set)
  const paidInvoices = await Invoice.find({
    status: "Paid",
    "payments.0": { $exists: true },
  })
    .select("customer docDate payments")
    .lean();

  // Build payment days map: customerId → [days]
  const paymentDaysMap = {};
  for (const inv of paidInvoices) {
    const customerId = inv.customer?.toString();
    if (!customerId) continue;
    const lastPayment = new Date(Math.max(...inv.payments.map((p) => new Date(p.date).getTime())));
    const days = Math.floor((lastPayment - new Date(inv.docDate || inv.createdAt)) / MS_PER_DAY);
    if (days >= 0) {
      if (!paymentDaysMap[customerId]) paymentDaysMap[customerId] = [];
      paymentDaysMap[customerId].push(days);
    }
  }

  return statsRows.map((r) => {
    const customerId = r._id?.toString();
    const paymentDays = paymentDaysMap[customerId] || [];
    return {
      customer: r.customerDoc
        ? { _id: r.customerDoc._id, name: r.customerDoc.name, email: r.customerDoc.email, phone: r.customerDoc.phone }
        : null,
      invoiceCount: r.invoiceCount,
      paidInvoiceCount: r.paidInvoiceCount,
      totalInvoiced: round(r.totalInvoiced),
      totalPaid: round(r.totalPaid),
      totalOutstanding: round(r.totalInvoiced - r.totalPaid),
      paymentRate:
        r.invoiceCount > 0 ? round((r.paidInvoiceCount / r.invoiceCount) * 100) : 0,
      avgDaysToPay:
        paymentDays.length > 0
          ? Math.round(paymentDays.reduce((s, d) => s + d, 0) / paymentDays.length)
          : null,
    };
  });
};
