// ── Company / Seller constants ─────────────────────────────────────────────────
export const SELLER = {
  name: "Dijet India Pvt Ltd",
  nameUpper: "DIJET INDIA PVT LTD",
  address:
    "305, Mahant Chambers, Plot No. 315, Road No. 34, Wagle Estate, MIDC Industrial Area, Thane, Maharashtra 400604",
  gstin: "[TODO: DIJET INDIA GSTIN]",
  pan: "[TODO: DIJET INDIA PAN]",
  state: "Maharashtra",
  stateCode: "27",
  shipToAddress:
    "305, Mahant Chambers, Plot No. 315, Road No. 34, Wagle Estate, MIDC Industrial Area, Thane, Maharashtra 400604",
  shipToPhone: "[TODO: PHONE]",
  shipToEmail: "[TODO: EMAIL]",
  bank: {
    name: "[TODO: BANK NAME]",
    accountHolder: "DIJET INDIA PVT LTD",
    accountNo: "[TODO: ACCOUNT NO]",
    ifsc: "[TODO: IFSC]",
  },
};

// ── Default terms & conditions ─────────────────────────────────────────────────
export const DEFAULT_INVOICE_TERMS = [
  "Please Make Cheque / DD payable to Dijet India Pvt Ltd",
  "Goods Once sold cannot be taken back.",
  "All disputes subject to Maharashtra jurisdiction Only",
];

export const DEFAULT_PO_TERMS = [
  "Tax will be applicable as per GST norms",
  "Buyer & Seller GST Number should be mentioned in Invoice and the invoice should be in GST Format with three copies (original/duplicate and triplicate)",
  "E-Way bill is mandatory for all supply invoices.",
  "Complete Bill to and Ship to Address should be mentioned in all invoices and Packing list as per our purchase order.",
  "Dijet India Pvt Ltd will not be liable for excess materials supplied without Purchase Order.",
];

// ── GST defaults ───────────────────────────────────────────────────────────────
export const DEFAULT_GST_RATE = 18;

// ── Financial year helper (April–March cycle) ─────────────────────────────────
export const getFinancialYear = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 4) {
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  }
  return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
};

// ── Financial year filter helpers ─────────────────────────────────────────────
// Returns the FY ending year for the current date.
// Apr 2026 → 2027 (FY 26-27).  Jan 2026 → 2026 (FY 25-26).
export const getCurrentFYYear = () => {
  const now = new Date();
  return now.getMonth() + 1 >= 4 ? now.getFullYear() + 1 : now.getFullYear();
};

// Returns { startDate, endDate } for a given FY ending year.
// year=2027 → Apr 1 2026 00:00:00  to  Apr 1 2027 00:00:00
export const getFYDateRange = (year) => {
  const y = parseInt(year) || getCurrentFYYear();
  return {
    startDate: new Date(y - 1, 3, 1),
    endDate: new Date(y, 3, 1),
  };
};
