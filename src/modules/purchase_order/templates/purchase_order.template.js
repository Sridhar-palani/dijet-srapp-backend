import puppeteer from "puppeteer";
import { getPurchaseOrderPages, renderPurchaseOrderPage } from "./purchase_order.components.js";
import config from "../../../config/env.js";

const generatePurchaseOrderPDF = async (po) => {
  const poData = po.toObject ? po.toObject() : po;
  const pages = getPurchaseOrderPages(poData);

  const browser = await puppeteer.launch({
    executablePath: config.puppeteerExecutablePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  const html = `
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page {
          size: A4;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          font-family: "Space Grotesk", Arial, sans-serif;
          color: #111111;
        }

        .po-page {
          width: 210mm;
          height: 297mm;
          margin: 0 auto;
          background: #ffffff;
          overflow: hidden;
          position: relative;
          box-shadow: none;
          padding: 9mm 12.6mm 5.6mm 12.6mm;
          page-break-after: always;
        }

        .po-page:last-child {
          page-break-after: auto;
        }

        .po-header {
          display: grid;
          grid-template-columns: 1fr 60mm;
          align-items: start;
        }

        .po-logo-wrap {
          min-height: 21mm;
        }

        .po-logo {
          width: 48mm;
          height: auto;
          display: block;
          margin-left: 2.2mm;
        }

        .po-header-right {
          justify-self: end;
          width: 59.5mm;
          padding-top: 0.35mm;
        }

        .po-title {
          text-align: right;
          font-size: 22px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.01em;
          margin-bottom: 2.2mm;
        }

        .po-meta-table {
          margin-left: auto;
          display: flex;
          flex-direction: column;
          font-size: 13px;
          line-height: 1.3;
          width: 100%;
        }

        .po-meta-row {
          display: grid;
          grid-template-columns: 32mm 1fr;
          align-items: start;
        }

        .po-meta-label {
          font-weight: 600;
          padding: 0 2mm 0.6mm 0;
          white-space: nowrap;
        }

        .po-meta-value {
          padding: 0 0 0.6mm 0;
          text-align: left;
          font-weight: 600;
          white-space: nowrap;
        }

        .po-top-line {
          height: 0.3mm;
          background: #27a645;
          margin-top: 1.25mm;
        }

        .po-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5mm;
          padding-top: 3.5mm;
          padding-bottom: 3.5mm;
          border-bottom: none;
        }

        .po-left-info {
          font-size: 13px;
          line-height: 1.35;
        }

        .po-block-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 0.8mm;
        }

        .po-left-name {
          font-weight: 700;
        }

        .po-block-gap {
          height: 2.5mm;
        }

        .po-right-info {
          font-size: 13px;
          line-height: 1.3;
        }

        .po-inline-account {
          display: none;
        }

        .po-vendor-table {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .po-vendor-row {
          display: grid;
          grid-template-columns: 32mm 1fr;
          align-items: start;
        }

        .po-vendor-label {
          font-size: 13px;
          font-weight: 600;
          padding: 0 1.25mm 0.6mm 0;
          white-space: nowrap;
        }

        .po-vendor-value {
          font-size: 13px;
          min-width: 0;
          padding: 0 0 0.6mm 0;
        }

        .po-vendor-name {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          letter-spacing: 0.01em;
        }

        .po-vendor-address-row .po-vendor-value {
          line-height: 1.25;
        }

        .po-vendor-address-row .po-vendor-value > div {
          margin-bottom: 0.2mm;
        }

        .po-contact-line {
          display: flex;
          align-items: center;
          gap: 0.9mm;
        }

        .po-contact-icon {
          width: 2.5mm;
          color: #27a645;
          font-size: 11px;
          line-height: 1;
          display: inline-block;
          flex: none;
          text-align: center;
        }

        .po-table-wrap {
          margin-top: 3mm;
        }

        .po-items-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
          line-height: 1.3;
        }

        .po-items-table th,
        .po-items-table td {
          border: 0.25mm solid #909090;
        }

        .po-items-table thead tr {
          background-color: #f5f5f5;
        }

        .po-items-table th {
          font-weight: 600;
          text-align: center;
          padding: 1.6mm 1mm;
          white-space: nowrap;
        }

        .po-items-table td {
          padding: 1.3mm 1mm;
          vertical-align: top;
          text-align: center;
        }

        .po-item-row td {
          height: 7.5mm;
        }

        .po-empty-row td {
          height: 7.5mm;
        }

        .po-items-table tbody td {
          border-top: none !important;
          border-bottom: none !important;
        }

        .po-items-table tbody tr:last-child td {
          border-bottom: 0.25mm solid #909090 !important;
        }

        .po-left-align {
          text-align: left;
        }

        .po-center {
          text-align: center;
        }

        .po-right-align {
          text-align: right;
        }

        .po-total-wrap {
          margin-top: 0;
        }

        .po-total-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
          line-height: 1.3;
        }

        .po-total-table td {
          border: 0.25mm solid #909090;
          padding: 1.5mm 1.2mm;
          vertical-align: middle;
        }

        .po-total-words {
          white-space: nowrap;
        }

        .po-total-label {
          font-weight: 600;
        }

        .po-total-label-cell {
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
        }

        .po-total-amount-cell {
          font-weight: 600;
          text-align: right;
          white-space: nowrap;
        }

        .po-terms {
          margin-top: 3mm;
          font-size: 10.5px;
          line-height: 1.4;
        }

        .po-terms-title {
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 1.2mm;
        }

        .po-terms ol {
          margin: 0;
          padding-left: 4.5mm;
        }

        .po-terms li {
          margin: 0 0 0.5mm 0;
        }

        .po-footer {
          position: absolute;
          left: 12.6mm;
          right: 12.6mm;
          bottom: 5mm;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          font-size: 9px;
          line-height: 1.2;
          color: #5f5f5f;
        }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <title>Purchase Order</title>
    </head>
    <body>
      ${pages.map((pagePo) => renderPurchaseOrderPage(pagePo)).join("")}
    </body>
  </html>`;

  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();
  return pdfBuffer;
};

export default generatePurchaseOrderPDF;
