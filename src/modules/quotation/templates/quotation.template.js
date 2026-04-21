import puppeteer from "puppeteer";
import {
  ItemComponent,
  FooterComponent,
  HeaderComponent,
  PreFooterComponent,
  HeadingsComponent,
} from "./quotation.components.js";
import config from "../../../config/env.js";

const ITEMS_PAGE_ONE = 6;   // page 1 has header — less vertical space
const ITEMS_PAGE_MID = 8;   // middle continuation pages — no header, no prefooter
const ITEMS_PAGE_LAST = 8;  // last continuation page — 7 was too conservative and created blank-looking page 2 + unnecessary page 3

const buildChunks = (items) => {
  const chunks = [];

  // Page 1
  chunks.push(items.slice(0, ITEMS_PAGE_ONE));

  // Fill subsequent pages with MID capacity
  for (let i = ITEMS_PAGE_ONE; i < items.length; i += ITEMS_PAGE_MID) {
    chunks.push(items.slice(i, i + ITEMS_PAGE_MID));
  }

  // If the last continuation page has more items than it can hold with
  // PreFooter + Footer, split the overflow onto a new final page
  if (chunks.length > 1) {
    const last = chunks[chunks.length - 1];
    if (last.length > ITEMS_PAGE_LAST) {
      chunks[chunks.length - 1] = last.slice(0, ITEMS_PAGE_LAST);
      chunks.push(last.slice(ITEMS_PAGE_LAST));
    }
  }

  return chunks;
};

const buildPages = (quotation, { showDiscount } = {}) => {
  const chunks = buildChunks(quotation.items);
  const hasDiscount = showDiscount !== undefined
    ? showDiscount
    : quotation.items.some((i) => (i.discountPercent || 0) > 0);

  return chunks
    .map((chunkItems, index) => {
      const isFirst = index === 0;
      const isLast = index === chunks.length - 1;

      // Compute startIndex from actual chunk sizes (chunks can vary in length)
      const startIndex = chunks
        .slice(0, index)
        .reduce((sum, c) => sum + c.length, 0);

      return `
    <div class="a4 bg-white shadow-lg w-[210mm] h-[297mm] overflow-hidden flex flex-col relative">
      <span class="absolute top-2 right-3 text-[0.45rem] text-gray-800">Page ${index + 1} of ${chunks.length}</span>
      ${isFirst ? HeaderComponent(quotation) : '<div class="pt-6"></div>'}
      <section class="overflow-hidden">
        ${HeadingsComponent(hasDiscount)}
        ${ItemComponent(chunkItems, startIndex, hasDiscount)}
      </section>
      ${isLast ? PreFooterComponent(quotation) : ""}
      ${FooterComponent}
    </div>`;
    })
    .join("\n");
};

const generateQuotation = async (quotation, { showDiscount } = {}) => {
  const browser = await puppeteer.launch({
    executablePath: config.puppeteerExecutablePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage();

  const html = `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <style type="text/tailwindcss">
      @theme {
        --color-retro: #27a645;
        --text-sri: 0.69rem;
        --color-fixed: #000000;
        --text-sri1: 0.74rem;
        --text-sri2: 0.79rem;
      }
      @layer base {
        body {
          font-family: "Space Grotesk", sans-serif;
          background-color: #f5f5f5;
        }
      }
    </style>
    <style>
      @media print {
        @page {
          size: A4;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
        }

        .a4 {
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          box-shadow: none;
          page-break-after: always;
          break-after: page;
        }

        .a4:last-child {
          page-break-after: avoid;
          break-after: avoid;
        }
      }
    </style>
    <link
      href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
      rel="stylesheet"
    />

    <title>Quotation</title>
  </head>
  <body class="flex flex-col items-center gap-4 py-8">
    ${buildPages(quotation, { showDiscount })}
  </body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

  await browser.close();
  return pdfBuffer;
};

export default generateQuotation;
