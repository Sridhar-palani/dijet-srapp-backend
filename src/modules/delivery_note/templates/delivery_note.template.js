import puppeteer from "puppeteer";
import {
  DNHeaderComponent,
  DNHeadingsComponent,
  DNItemsComponent,
  DNPreFooterComponent,
  DNFooterComponent,
} from "./delivery_note.components.js";
import config from "../../../config/env.js";

const generateDeliveryNotePDF = async (dn) => {
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style type="text/tailwindcss">
      @theme {
        --color-retro: #eed202;
        --text-sri: 0.69rem;
        --color-fixed: #000000;
        --text-sri1: 0.74rem;
        --text-sri2: 0.79rem;
      }
      @layer base {
        body { font-family: "Inter", sans-serif; background-color: #f5f5f5; }
      }
    </style>
    <style>
      @media print {
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; }
        .a4 { width: 210mm; min-height: 297mm; box-shadow: none; page-break-after: always; }
      }
    </style>
    <title>Delivery Note</title>
  </head>
  <body class="flex flex-col justify-center items-center min-h-screen">
    <div class="a4 bg-white shadow-lg w-[210mm] min-h-[297mm] flex flex-col">
      ${DNHeaderComponent(dn)}
      <section id="body">
        ${DNHeadingsComponent}
        ${DNItemsComponent(dn.items)}
      </section>
      ${DNPreFooterComponent(dn)}
      ${DNFooterComponent}
    </div>
  </body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdfBuffer;
};

export default generateDeliveryNotePDF;
