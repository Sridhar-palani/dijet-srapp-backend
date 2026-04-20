import puppeteer from "puppeteer";
import {
  InvoiceHeaderComponent,
  InvoiceHeadingsComponent,
  InvoiceItemsComponent,
  InvoiceContinuationSummaryComponent,
  MAX_ITEMS_PER_PAGE,
  InvoiceTaxSummaryComponent,
} from "./invoice.components.js";
import config from "../../../config/env.js";

const INVOICE_COPY_LABELS = [
  "Original for Recipient",
  "Duplicate for Transporter",
  "Triplicate for Supplier",
  "Extra Copy",
];

const splitItems = (items = [], size = 10, lastPageLimit = size) => {
  if (!Array.isArray(items) || items.length === 0) return [[]];

  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  // Keep breathing space on the last page for totals + footer summary.
  // If last page is full-sized, split off overflow to a new final page.
  const last = chunks[chunks.length - 1];
  if (last && last.length > lastPageLimit) {
    chunks[chunks.length - 1] = last.slice(0, lastPageLimit);
    chunks.push(last.slice(lastPageLimit));
  }

  return chunks;
};

const generateInvoicePDF = async (invoice) => {
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
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style type="text/tailwindcss">
      @theme {
        --color-retro: #eed202;
        --text-sri: 0.69rem;
        --color-fixed: #000000;
        --text-sri1: 0.74rem;
        --text-sri2: 0.79rem;
      }
      @layer base {
        body { font-family: "Space Grotesk", sans-serif; background-color: #f5f5f5; }
      }
    </style>
    <style>
      @media print {
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        .a4 { width: 210mm; height: 297mm; box-shadow: none; page-break-after: always; overflow: hidden; }
        .a4:last-child { page-break-after: auto; }
      }
    </style>
    <title>Tax Invoice</title>
  </head>
  <body class="flex flex-col justify-center items-center min-h-screen">
    ${INVOICE_COPY_LABELS.map(
      (label) => {
        const itemChunks = splitItems(invoice.items, MAX_ITEMS_PER_PAGE, MAX_ITEMS_PER_PAGE);
        const totalPages = itemChunks.length;

        return itemChunks
          .map((chunk, chunkIndex) => {
            const pageNo = chunkIndex + 1;
            const isLastPage = pageNo === totalPages;
            return `
              <div class="a4 bg-white shadow-lg w-[210mm] h-[297mm] flex flex-col overflow-hidden">
                ${InvoiceHeaderComponent(invoice, label)}
                <section id="body" class="flex flex-col flex-1">
                  ${InvoiceHeadingsComponent}
                  ${InvoiceItemsComponent(chunk, {
                    startIndex: chunkIndex * MAX_ITEMS_PER_PAGE,
                    showTotal: isLastPage,
                    totalsItems: invoice.items,
                  })}
                </section>
                ${
                  isLastPage
                    ? InvoiceTaxSummaryComponent(invoice, pageNo, totalPages)
                    : InvoiceContinuationSummaryComponent(pageNo, totalPages)
                }
              </div>`;
          })
          .join("");
      }
    ).join("")}
  </body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdfBuffer;
};

export default generateInvoicePDF;
