import loadBase64Image from "../../../utils/loadImage.js";
import { amountInWords, formatIndianNumber, formatDateDDMMMYYYY } from "../../quotation/helpers/quotation.helpers.js";
import { SELLER } from "../../../constants/index.js";

const dijetIndiaImage = loadBase64Image("public/Images/dijet-india-logo.png");

const TABLE_BODY_HEIGHT = "22.6rem";
export const MAX_ITEMS_PER_PAGE = 20;
const ITEM_ROW_HEIGHT = "1.40rem";
const TOTAL_ROW_HEIGHT = "1.60rem";
const GRID_COLS = "0.3fr 2.25fr 0.72fr 0.62fr 0.98fr 0.38fr 0.98fr 0.26fr 0.84fr 0.26fr 0.84fr 0.26fr 0.9fr";

const normalizeAddress = (address = "") =>
  String(address || "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

const toLines = (value, maxLines = 4, maxChars = 34) => {
  const text = normalizeAddress(value);
  if (!text) return ["-"];

  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    lines.push(line || word);
    line = line && line !== word ? word : "";
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines.slice(0, maxLines);
};

const AddressLines = (address, maxLines = 4, maxChars = 34) =>
  toLines(address, maxLines, maxChars)
    .map((line) => `<p class="leading-tight break-words">${line}</p>`)
    .join("");

const metaValue = (value) => String(value ?? "-").trim() || "-";
const clipText = (value, maxChars = 24) => {
  const text = metaValue(value);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
};
const optionalText = (value) => {
  const text = String(value ?? "").trim();
  return text || "-";
};
const quantityText = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return metaValue(value);
  return Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(/\.?0+$/, "");
};
const currency = (value, withSymbol = true) =>
  withSymbol ? `&#8377;${formatIndianNumber(value || 0)}` : formatIndianNumber(value || 0);

const stateCodeText = (stateCode, stateName) => {
  const code = metaValue(stateCode);
  if (code === "-") return "-";
  return code.includes("-") ? code : `${code}${stateName ? ` - ${stateName}` : ""}`;
};

export const InvoiceHeaderComponent = (invoice, copyLabel = "Original for Recipient") => `
  <div class="border border-gray-500 mx-3 mt-3 text-sri">
    <div class="flex justify-between items-center border-b border-gray-500 py-1.5 px-3">
      <p class="flex-1 text-center text-[0.98rem] font-bold tracking-[0.16em]">TAX INVOICE</p>
      <p class="text-sri text-gray-600 whitespace-nowrap">( ${copyLabel} )</p>
    </div>

    <div class="flex" style="min-height:164px;">
      <div class="border-r border-gray-500 p-2 flex flex-col overflow-hidden" style="width:29%;">
        <div class="h-[3.8rem] w-[11.2rem] ml-1 mt-1 mb-3">
          <img src="${dijetIndiaImage}" class="h-full w-full object-contain object-left" />
        </div>
        <div class="space-y-0.5">
          <p class="font-bold text-sri1">${SELLER.nameUpper}</p>
          ${AddressLines(SELLER.address, 5, 33)}
          <p>${SELLER.state} , INDIA</p>
          <p><span class="text-retro">&#9742;</span> ${SELLER.shipToPhone || "-"}</p>
          <p><span class="text-retro">&#9993;</span> ${SELLER.shipToEmail}</p>
          <p>State Code : ${SELLER.stateCode} - ${SELLER.state}</p>
          <p>GSTIN:${SELLER.gstin}</p>
          <p>PAN NO: ${SELLER.pan}</p>
        </div>
      </div>

      <div class="border-r border-gray-500 p-2 flex flex-col overflow-hidden" style="width:36%;">
        <p class="font-semibold mb-0.5">Invoiced To :</p>
        <div class="ml-4 space-y-0.5">
          <p class="font-bold">${invoice.billTo?.name || "-"}</p>
          ${AddressLines(invoice.billTo?.address, 4, 34)}
          <p>INDIA</p>
          <p>GSTIN: ${invoice.billTo?.gstin || "-"}</p>
          <p>State Code : ${stateCodeText(invoice.billTo?.stateCode, invoice.billTo?.state || "Tamil Nadu")}</p>
        </div>
        <p class="font-semibold mt-2 mb-0.5">Shipped To :</p>
        <div class="ml-4 space-y-0.5">
          <p>${invoice.shipTo?.name || invoice.billTo?.name || "-"}</p>
          ${AddressLines(invoice.shipTo?.address || invoice.billTo?.address, 4, 34)}
          <p>INDIA</p>
          <p><span class="text-retro">&#9742;</span> ${metaValue(invoice.shipTo?.phone || invoice.billTo?.phone)}</p>
          <p><span class="text-retro">&#9993;</span> ${metaValue(invoice.shipTo?.email || invoice.billTo?.email)}</p>
        </div>
      </div>

      <div class="p-2 flex flex-col overflow-hidden" style="width:35%;">
        <table class="w-full table-fixed text-sri1">
          <colgroup>
            <col style="width:46%;" />
            <col style="width:4%;" />
            <col style="width:50%;" />
          </colgroup>
          <tbody>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Invoice No</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.invoiceNumber, 18)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Invoice Date</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${invoice.invoiceDate ? formatDateDDMMMYYYY(new Date(invoice.invoiceDate)) : "-"}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">e-way Bill No</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.eWayBillNo, 16)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Buyer's Order No</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.buyerOrderNo, 16)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Buyer's Order Date</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${invoice.buyerOrderDate ? formatDateDDMMMYYYY(new Date(invoice.buyerOrderDate)) : "-"}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Terms of Payment</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.paymentTerms, 14)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Delivery Note</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.deliveryNote, 12)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Dispatched through</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.dispatchedThrough, 12)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Dispatch Doc No</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(invoice.dispatchDocNo, 14)}</span></td></tr>
            <tr><td class="font-semibold pr-1 pb-0.5 whitespace-nowrap">Other Reference</td><td class="text-center pb-0.5">:</td><td class="pb-0.5"><span class="block max-w-full whitespace-nowrap overflow-hidden text-ellipsis">${clipText(optionalText(invoice.otherReference), 12)}</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>`;

export const InvoiceHeadingsComponent = `
  <div class="mx-3 mt-0 text-sri2 font-semibold border-b border-retro">
    <div class="grid text-center border-b border-gray-400 py-0.5 px-1 text-[0.61rem] divide-x divide-gray-300" style="grid-template-columns:${GRID_COLS};">
      <p class="min-w-0 whitespace-nowrap">No.</p>
      <p class="min-w-0 whitespace-nowrap">Item Description</p>
      <p class="min-w-0 whitespace-nowrap">HSN/SAC</p>
      <p class="min-w-0 whitespace-nowrap">Quantity</p>
      <p class="min-w-0 whitespace-nowrap">Unit Rate</p>
      <p class="min-w-0 whitespace-nowrap">Dis (%)</p>
      <p class="min-w-0 whitespace-nowrap">Total (&#8377;)</p>
      <p class="col-span-2 min-w-0 whitespace-nowrap">SGST</p>
      <p class="col-span-2 min-w-0 whitespace-nowrap">CGST</p>
      <p class="col-span-2 min-w-0 whitespace-nowrap">IGST</p>
    </div>
    <div class="grid text-center py-0.5 px-1 text-[0.58rem] divide-x divide-gray-300" style="grid-template-columns:${GRID_COLS};">
      <p></p><p></p><p></p><p></p><p></p><p></p><p></p>
      <p class="min-w-0 whitespace-nowrap">%</p><p class="min-w-0 whitespace-nowrap">Amount (&#8377;)</p>
      <p class="min-w-0 whitespace-nowrap">%</p><p class="min-w-0 whitespace-nowrap">Amount (&#8377;)</p>
      <p class="min-w-0 whitespace-nowrap">%</p><p class="min-w-0 whitespace-nowrap">Amount (&#8377;)</p>
    </div>
  </div>`;

export const InvoiceItemsComponent = (
  items,
  { startIndex = 0, showTotal = true, totalsItems = items } = {}
) => {
  const rows = items
    .map(
      (item, index) => `
    <div class="grid text-center px-1 items-center content-center divide-x divide-gray-300"
         style="grid-template-columns:${GRID_COLS}; padding-top:0.105rem; padding-bottom:0.06rem; flex:1 1 0;"
         >
      <p class="min-w-0 whitespace-nowrap text-[0.62rem]">${startIndex + index + 1}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-center font-medium text-[0.62rem]">${clipText(item.description, 26)}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${clipText(item.hsnCode, 10)}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${quantityText(item.quantity)} pcs</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-right pr-0.5 text-[0.62rem]">${currency(item.unitRate)}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${item.discount != null && item.discount !== 0 ? clipText(item.discount, 5) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-right pr-0.5 text-[0.62rem]">${currency(item.taxableAmount)}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${item.sgst?.rate > 0 ? clipText(item.sgst.rate, 5) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-right pr-0.5 text-[0.62rem]">${item.sgst?.amount > 0 ? currency(item.sgst.amount, false) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${item.cgst?.rate > 0 ? clipText(item.cgst.rate, 5) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-right pr-0.5 text-[0.62rem]">${item.cgst?.amount > 0 ? currency(item.cgst.amount, false) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-[0.62rem]">${item.igst?.rate > 0 ? clipText(item.igst.rate, 5) : "-"}</p>
      <p class="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-right pr-0.5 text-[0.62rem]">${item.igst?.amount > 0 ? currency(item.igst.amount, false) : "-"}</p>
    </div>`
    )
    .join("");

  const totalQty = totalsItems.reduce((s, i) => s + i.quantity, 0);
  const totalTaxable = totalsItems.reduce((s, i) => s + i.taxableAmount, 0);
  const totalSGST = totalsItems.reduce((s, i) => s + (i.sgst?.amount || 0), 0);
  const totalCGST = totalsItems.reduce((s, i) => s + (i.cgst?.amount || 0), 0);
  const totalIGST = totalsItems.reduce((s, i) => s + (i.igst?.amount || 0), 0);

  const emptyRows = Math.max(0, MAX_ITEMS_PER_PAGE - items.length);
  const fillerRows = Array.from({ length: emptyRows }, () => `
    <div class="grid text-center px-1 items-center content-center divide-x divide-gray-300"
         style="grid-template-columns:${GRID_COLS}; padding-top:0.105rem; padding-bottom:0.06rem; flex:1 1 0;">
      <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
    </div>`).join("");

  const totalRow = `
    <div class="grid text-center border-b border-retro font-semibold px-1 items-center content-center divide-x divide-gray-300"
         style="grid-template-columns:${GRID_COLS}; min-height:${TOTAL_ROW_HEIGHT}; padding-top:0.105rem; padding-bottom:0.06rem;">
      <p></p>
      <p class="text-left text-[0.62rem]">Total</p>
      <p></p>
      <p class="text-[0.62rem]">${totalQty} Pcs</p>
      <p></p>
      <p></p>
      <p class="whitespace-nowrap text-right pr-0.5 text-[0.62rem]">${currency(totalTaxable)}</p>
      <p></p>
      <p class="whitespace-nowrap text-right pr-0.5 text-[0.62rem]">${totalSGST > 0 ? currency(totalSGST, false) : "-"}</p>
      <p></p>
      <p class="whitespace-nowrap text-right pr-0.5 text-[0.62rem]">${totalCGST > 0 ? currency(totalCGST, false) : "-"}</p>
      <p></p>
      <p class="whitespace-nowrap text-right pr-0.5 text-[0.62rem]">${totalIGST > 0 ? currency(totalIGST, false) : "-"}</p>
    </div>`;

  const continuationRow = `
    <div class="grid text-sri1 text-center border-b border-retro font-semibold px-1 items-center content-center divide-x divide-gray-300"
         style="grid-template-columns:${GRID_COLS}; min-height:${TOTAL_ROW_HEIGHT}; padding-top:0.105rem; padding-bottom:0.06rem;">
      <p></p>
      <p class="text-left">Continued...</p>
      <p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p><p></p>
    </div>`;

  return `
    <div class="mx-3 border-l border-r border-gray-300 flex-1 flex flex-col" style="height:${TABLE_BODY_HEIGHT}; min-height:${TABLE_BODY_HEIGHT};">
      ${rows}
      ${fillerRows}
      ${showTotal ? totalRow : continuationRow}
    </div>`;
};

export const InvoiceTaxSummaryComponent = (invoice, pageNumber = 1, totalPages = 1) => {
  const t = invoice.taxSummary;
  return `
  <section class="mx-3 mt-0 text-sri border border-t-0 border-gray-500 flex flex-col">
    <!-- Amount in words (left) + Tax table (right) -->
    <div class="flex border-b border-gray-500" style="font-size:0.58rem; line-height:1.2;">
      <div class="p-2 border-r border-gray-500" style="width:75%;">
        <p class="font-semibold mb-1" style="font-size:0.58rem; line-height:1.2;">Amount in words</p>
        <table class="w-full" style="font-size:0.58rem; line-height:1.2;">
          <tbody>
            <tr><td class="font-semibold pr-2 align-top whitespace-nowrap" style="width:27%;">Total Before Tax</td><td class="align-top leading-tight">${amountInWords(t.totalBeforeTax)}</td></tr>
            <tr><td class="font-semibold pr-2 align-top whitespace-nowrap">Total Tax Amount</td><td class="align-top leading-tight">${amountInWords(t.totalTax)}</td></tr>
            <tr><td class="font-semibold pr-2 align-top whitespace-nowrap">Total Amount After Tax</td><td class="align-top leading-tight">${amountInWords(t.totalAfterTax)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="p-2" style="width:25%;">
        <table class="w-full" style="font-size:0.58rem; line-height:1.2;">
          <tbody>
            <tr><td class="pr-2 pb-0.5">Total Before Tax</td><td class="text-right pb-0.5">${formatIndianNumber(t.totalBeforeTax)}</td></tr>
            <tr><td class="pr-2 pb-0.5">SGST Total</td><td class="text-right pb-0.5">${t.totalSGST > 0 ? formatIndianNumber(t.totalSGST) : "-"}</td></tr>
            <tr><td class="pr-2 pb-0.5">CGST Total</td><td class="text-right pb-0.5">${t.totalCGST > 0 ? formatIndianNumber(t.totalCGST) : "-"}</td></tr>
            <tr><td class="pr-2 pb-0.5">IGST Total</td><td class="text-right pb-0.5">${t.totalIGST > 0 ? formatIndianNumber(t.totalIGST) : "-"}</td></tr>
            <tr class="border-t border-gray-400"><td class="font-semibold pr-2 pt-0.5">Total Tax Amount</td><td class="text-right font-semibold pt-0.5">${formatIndianNumber(t.totalTax)}</td></tr>
            <tr><td class="font-semibold pr-2 pb-0.5">Total Amount After Tax</td><td class="text-right font-semibold pb-0.5">${formatIndianNumber(t.totalAfterTax)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bottom: T&C | Bank + Declaration | Signatory -->
    <div class="flex border-b border-gray-500 text-[0.55rem]">
      <div class="p-2 border-r border-gray-500" style="width:36%;">
        <p class="font-semibold mb-1">Terms &amp; Conditions</p>
        <ol class="list-decimal pl-4 space-y-0.5">
          ${invoice.termsAndConditions?.map((term) => `<li>${term}</li>`).join("") || ""}
        </ol>
        <p class="font-semibold mt-2 mb-1">Declaration</p>
        <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
      </div>

      <div class="p-2 border-r border-gray-500" style="width:36%; font-size:0.58rem; line-height:1.2;">
        <p class="font-semibold mb-1">Bank Details:</p>
        <table class="w-full" style="font-size:0.58rem; line-height:1.2;">
          <tbody>
            <tr><td class="pr-2 align-top whitespace-nowrap" style="width:5.6rem;">Bank</td><td class="align-top whitespace-nowrap">: ${SELLER.bank.name}</td></tr>
            <tr><td class="pr-2 align-top whitespace-nowrap">Account Holder Name</td><td class="align-top whitespace-nowrap">: ${SELLER.bank.accountHolder}</td></tr>
            <tr><td class="pr-2 align-top whitespace-nowrap">Account number</td><td class="align-top whitespace-nowrap">: ${SELLER.bank.accountNo}</td></tr>
            <tr><td class="pr-2 align-top whitespace-nowrap">IFSC Code</td><td class="align-top whitespace-nowrap">: ${SELLER.bank.ifsc}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="p-2 flex flex-col justify-between" style="width:28%;">
        <p class="text-right font-semibold">For Dijet India Pvt Ltd</p>
        <p class="text-right border-t border-gray-400 pt-1 mt-10 text-gray-500">Authorized Signatory</p>
      </div>
    </div>

    <div class="flex justify-between px-3 py-1 text-[0.48rem] text-gray-500 mt-auto">
      <p class="flex-1 text-center">This is an electronically generated document</p>
      <p>Page ${pageNumber} of ${totalPages}</p>
    </div>
  </section>`;
};

export const InvoiceContinuationSummaryComponent = (pageNumber = 1, totalPages = 1) => `
  <section class="mx-3 mt-0 text-sri border border-t-0 border-gray-500 flex flex-col">
    <div class="border-b border-gray-500 flex items-center justify-center text-[0.62rem] text-gray-600" style="height:8.85rem;">
      Continued on next page
    </div>
    <div class="flex justify-between px-3 py-1 text-[0.48rem] text-gray-500 mt-auto">
      <p class="flex-1 text-center">This is an electronically generated document</p>
      <p>Page ${pageNumber} of ${totalPages}</p>
    </div>
  </section>`;
