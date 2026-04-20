import AppError from "../../../utils/AppError.js";

export const totalNet = (items) => {
  return items.reduce((acc, item) => acc + item.itemtotal, 0);
};

export const formatDateDDMMMYYYY = (date = new Date()) => {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const calculateItem = (items) => {
  return items.map((item) => {
    const discount = item.discountPercent || 0;
    const unitPrice = parseFloat((item.listprice * (1 - discount / 100)).toFixed(2));
    const itemtotal = parseFloat((unitPrice * item.quantity).toFixed(2));
    return { ...item, unitPrice, itemtotal };
  });
};

export const validateQuotationData = (data) => {
  if (!data.customer) {
    throw new AppError("Customer is required", 400);
  }
  if (!data.items || data.items.length === 0) {
    throw new AppError("At least one item is required to create a quotation", 400);
  }
  if (!data.validuntil) {
    throw new AppError("Valid until date is required", 400);
  }
  data.items.forEach((item) => {
    if (!item.listprice || !item.quantity || item.quantity <= 0) {
      throw new AppError("Each item must have a valid list price and quantity greater than zero", 400);
    }
  });
};
export const amountInWords = (amount) => {
  if (isNaN(amount)) return "";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  const numToWords = (num) => {
    let str = "";

    if (num > 99) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }

    if (num > 19) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }

    if (num > 0) {
      str += ones[num] + " ";
    }

    return str.trim();
  };

  const [rupeesPart, paisePart] = Number(amount)
    .toFixed(2)
    .split(".");

  let rupees = parseInt(rupeesPart, 10);
  let paise = parseInt(paisePart, 10);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let result = "";

  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;

  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;

  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;

  if (crore) result += numToWords(crore) + " Crore ";
  if (lakh) result += numToWords(lakh) + " Lakh ";
  if (thousand) result += numToWords(thousand) + " Thousand ";
  if (rupees) result += numToWords(rupees) + " Rupees";

  if (paise) {
    result += " and " + numToWords(paise) + " Paise";
  }

  return result.trim() + " Only";
};

export const formatIndianNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";

  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

