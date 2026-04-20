import loadBase64Image from "../../../utils/loadImage.js";
import { amountInWords, formatIndianNumber, formatDateDDMMMYYYY } from "../../quotation/helpers/quotation.helpers.js";

const dijetIndiaImage = loadBase64Image("public/Images/dijet-india-logo.png");

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AED: "د.إ",
  SGD: "S$",
};

const ROWS_PER_PAGE = 15;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatValue = (value, fallback = "-") => {
  if (value === null || value === undefined || value === "") return fallback;
  return escapeHtml(value);
};

const formatNumber = (value) => formatIndianNumber(Number(value || 0));

const currencySymbol = (currency) => CURRENCY_SYMBOLS[currency] || currency || "Rs";

const documentDate = (po) => {
  if (po.poDate) return formatDateDDMMMYYYY(new Date(po.poDate));
  if (po.date) return po.date;
  return formatDateDDMMMYYYY(new Date());
};

const splitAddress = (value, maxChars, maxLines) => {
  const text = String(value || "")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return ["-"];

  const segments = text
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const parts = segments.length
    ? segments.map((segment, index) => (index < segments.length - 1 ? `${segment},` : segment))
    : text.split(" ");

  const lines = [];
  let current = "";

  for (const part of parts) {
    const candidate = current ? `${current} ${part}` : part;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = part;
  }

  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const trimmed = lines.slice(0, maxLines);
  const lastIndex = maxLines - 1;
  trimmed[lastIndex] = `${trimmed[lastIndex].slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
  return trimmed;
};

const renderLines = (value, maxChars, maxLines, className = "") =>
  splitAddress(value, maxChars, maxLines)
    .map((line) => `<div${className ? ` class="${className}"` : ""}>${escapeHtml(line)}</div>`)
    .join("");

const renderMetaRow = (label, value) => `
  <div class="po-meta-row">
    <div class="po-meta-label">${label}</div>
    <div class="po-meta-value">${formatValue(value)}</div>
  </div>
`;

const renderVendorRow = (label, value, rowClass = "") => `
  <div class="po-vendor-row ${rowClass}">
    <div class="po-vendor-label">${label}</div>
    <div class="po-vendor-value">${value}</div>
  </div>
`;

const vendorPhoneLine = (value) =>
  value
    ? `<div class="po-contact-line"><span class="po-contact-icon">&#9742;</span><span>${formatValue(value)}</span></div>`
    : "";

const vendorMailLine = (value) =>
  value
    ? `<div class="po-contact-line"><span class="po-contact-icon">&#9993;</span><span>${formatValue(value)}</span></div>`
    : "";

export const getPurchaseOrderPages = (po) => {
  const items = Array.isArray(po.items) ? po.items : [];
  const chunks = items.length === 0 ? [[]] : [];

  for (let i = 0; i < items.length; i += ROWS_PER_PAGE) {
    chunks.push(items.slice(i, i + ROWS_PER_PAGE));
  }

  return chunks.map((chunkItems, index) => ({
    ...po,
    chunkItems,
    pageIndex: index + 1,
    totalPages: chunks.length,
    isLast: index === chunks.length - 1,
    displayDate: documentDate(po),
    currencySym: currencySymbol(po.currency),
    totalValue: items.reduce((sum, item) => sum + Number(item.total || 0), 0),
  }));
};

export const renderPurchaseOrderPage = (po) => {
  const rows = [...po.chunkItems];
  while (rows.length < ROWS_PER_PAGE) rows.push(null);

  const isINR = !po.currency || po.currency === "INR";
  const words = isINR ? (amountInWords(po.totalValue) || po.amountInWords) : "";

  return `
    <div class="po-page">
      <section class="po-header">
        <div class="po-logo-wrap">
          <img src="${dijetIndiaImage}" class="po-logo" />
        </div>
        <div class="po-header-right">
          <div class="po-title">PURCHASE ORDER</div>
          <div class="po-meta-table">
            ${renderMetaRow("Date", po.displayDate)}
            ${renderMetaRow("Number", po.poNumber)}
            ${renderMetaRow("Vendor account", po.vendor?.vendorAccount || po.vendorAccount)}
          </div>
        </div>
      </section>

      <div class="po-top-line"></div>

      <section class="po-info">
        <div class="po-left-info">
          <div class="po-block-title">Bill To :</div>
          <div class="po-left-name">${formatValue(po.billTo?.name)}</div>
          ${renderLines(po.billTo?.address, 38, 4)}
          <div>GSTIN :${formatValue(po.billTo?.gstin)}</div>
          <div>PAN NO: ${formatValue(po.billTo?.pan)}</div>
          <div>State Name : ${formatValue(po.billTo?.state)} , Code - ${formatValue(po.billTo?.stateCode)}</div>

          <div class="po-block-gap"></div>
          <div class="po-block-title">Ship To :</div>
          ${renderLines(po.shipTo?.address, 38, 4)}
          <div>PH: ${formatValue(po.shipTo?.phone)},</div>
          <div>Email: ${formatValue(po.shipTo?.email)}</div>
        </div>

        <div class="po-right-info">
          <div class="po-inline-account">Vendor account&nbsp;&nbsp;${formatValue(
            po.vendor?.vendorAccount || po.vendorAccount
          )}</div>
          <div class="po-vendor-table">
            ${renderVendorRow("Vendor account", formatValue(po.vendor?.vendorAccount || po.vendorAccount))}
            ${renderVendorRow(
              "Vendor name",
              `<span class="po-vendor-name">${formatValue(po.vendor?.name)}</span>`,
              "po-vendor-name-row"
            )}
            ${renderVendorRow(
              "Vendor address",
              `${renderLines(po.vendor?.address, 30, 4)}${vendorPhoneLine(po.vendor?.phone)}${vendorMailLine(po.vendor?.email)}`,
              "po-vendor-address-row"
            )}
            ${renderVendorRow("Tax Reg No", formatValue(po.vendor?.gstin))}
            ${renderVendorRow("Payment Terms", formatValue(po.paymentTerms))}
            ${renderVendorRow("Currency", formatValue(po.currency || "INR"))}
            ${renderVendorRow("Vendor Quote No", formatValue(po.vendorQuoteNo))}
            ${renderVendorRow("Buyer Req No", formatValue(po.buyerReqNo))}
          </div>
        </div>
      </section>

      <section class="po-table-wrap">
        <table class="po-items-table">
          <colgroup>
            <col style="width: 8%" />
            <col style="width: 29%" />
            <col style="width: 9%" />
            <col style="width: 6%" />
            <col style="width: 13%" />
            <col style="width: 8%" />
            <col style="width: 13%" />
            <col style="width: 14%" />
          </colgroup>
          <thead>
            <tr>
              <th>Item No</th>
              <th>Item Specification</th>
              <th>Quantity</th>
              <th>UOM</th>
              <th>List Rate ( ${po.currencySym} )</th>
              <th>Dis ( % )</th>
              <th>Unit Rate ( ${po.currencySym} )</th>
              <th>Total ( ${po.currencySym} )</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map((item, index) => {
                if (!item) {
                  return `
                    <tr class="po-empty-row">
                      <td>&nbsp;</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  `;
                }

                return `
                  <tr class="po-item-row">
                    <td>${index + 1 + (po.pageIndex - 1) * ROWS_PER_PAGE}</td>
                    <td>${formatValue(item.specification)}</td>
                    <td>${formatValue(item.quantity)}</td>
                    <td>${formatValue(item.uom || "PCS")}</td>
                    <td>${formatNumber(item.listRate)}</td>
                    <td>${item.discount ? formatValue(item.discount) : "-"}</td>
                    <td>${formatNumber(item.unitRate)}</td>
                    <td>${formatNumber(item.total)}</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </section>

      ${
        po.isLast
          ? `
            <section class="po-total-wrap">
              <table class="po-total-table">
                <colgroup>
                  <col style="width: 73%" />
                  <col style="width: 14%" />
                  <col style="width: 13%" />
                </colgroup>
                <tbody>
                  <tr>
                    <td class="po-total-words">${words ? `<span class="po-total-label">Amount In Words :</span> ${formatValue(words, "")}` : ""}</td>
                    <td class="po-total-label-cell">Total ( ${po.currencySym} )</td>
                    <td class="po-total-amount-cell">${formatNumber(po.totalValue)}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="po-terms">
              <div class="po-terms-title">TERMS AND CONDITIONS</div>
              <ol>
                ${(Array.isArray(po.termsAndConditions) ? po.termsAndConditions : [])
                  .map((term) => `<li>${formatValue(term)}</li>`)
                  .join("")}
              </ol>
            </section>
          `
          : ""
      }

      ${!po.isLast ? `<div style="position:absolute;bottom:18mm;left:0;right:0;text-align:center;font-size:10px;font-style:italic;color:#5f5f5f;">Continued on next page...</div>` : ""}

      <section class="po-footer">
        <div>This document was generated electronically and is valid without a signature.</div>
        <div>Page ${po.pageIndex} of ${po.totalPages}</div>
      </section>
    </div>
  `;
};
