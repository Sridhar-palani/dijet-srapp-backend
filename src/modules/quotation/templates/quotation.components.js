import loadBase64Image from "../../../utils/loadImage.js";
import { amountInWords, formatIndianNumber, formatDateDDMMMYYYY } from "../helpers/quotation.helpers.js";
import { SELLER } from "../../../constants/index.js";

// Indian number format without ₹ symbol — used in item rows
const formatItemNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatCurrency = (value) => `₹ ${formatItemNumber(value)}`;

const dijetIndustrialImage = loadBase64Image("public/Images/dijet-logo.png");
const dijetIndiaImage = loadBase64Image("public/Images/dijet-india-logo.png");

const clampText = (value, maxLength) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "-";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trimEnd()}...` : normalized;
};

export const ItemComponent = (data, startIndex = 0, hasDiscount = false) => {
  const cols = hasDiscount ? "grid-cols-10" : "grid-cols-8";
  const gapClass = hasDiscount ? "gap-2" : "gap-5";
  const numericCellClass = hasDiscount ? "whitespace-nowrap text-right text-[0.68rem]" : "";
  const itemHtml = data
    .map(
      (item, index) => {
        const itemData = item.itemData || {};
        const discountCells = hasDiscount
          ? `<p class="${numericCellClass}">${formatCurrency(item.listprice)}</p><p class="whitespace-nowrap">${item.discountPercent ? `${item.discountPercent}%` : "-"}</p>`
          : "";
        return `
    <div class="border-retro border-b py-2 mx-2">

      <!-- Main row -->
      <div class="grid ${cols} ${gapClass} text-sri1 text-center">
        <p>${startIndex + index + 1}</p>
        <p class="col-span-4 font-semibold text-left">
          ${itemData.name || "-"}
        </p>
        <p>${item.quantity} pcs</p>
        ${discountCells}
        <p class="${numericCellClass}">${formatCurrency(item.unitPrice)}</p>
        <p class="${numericCellClass}">${formatCurrency(item.itemtotal)}</p>
      </div>

      <!-- Image + meta -->
      <div class="grid grid-cols-8 gap-5 text-sri text-center">
        <img
          src="${itemData.image || ""}"
          class="relative left-4 top-5 h-8 w-auto object-contain"
        />

        <div class="col-span-5 text-left grid grid-cols-2">
          <div class="grid grid-cols-3">
            <div>
              <p>Make</p>
              <p>Tax</p>
            </div>
            <div>
              <p>: <span>${itemData.make || "-"}</span></p>
              <p>: <span>${item.tax || "-"}</span></p>
            </div>
          </div>
          <div class="grid grid-cols-3">
            <div>
              <p>HSN Code</p>
              <p>Delivery</p>
            </div>
            <div>
              <p>: <span>${item.hsncode || "-"}</span></p>
              <p>: <span>${item.delivery || "-"}</span></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Application -->
      <div class="grid grid-cols-8 gap-5 text-sri text-center">
        <div></div>
        <div class="col-span-7 text-left flex gap-5">
          <div>Application</div>
          <div>: ${itemData.application || "-"}</div>
        </div>
      </div>

      <!-- Notes -->
      <div class="grid grid-cols-8 gap-5 text-sri text-center">
        <div></div>
        <div class="col-span-7 text-left flex gap-13">
          <div>Note</div>
          <div>: ${item.notes || "-"}</div>
        </div>
      </div>

    </div>
  `;
      }
    )
    .join("");
  return itemHtml;
};

export const FooterComponent = `
    <section id="footer" class="text-[0.45rem] mt-auto pb-3 mx-4">
        <div class="grid grid-cols-4">
          <div class="border-retro border-r">
            <p class="font-semibold">DIJET INDIA PVT LTD</p>
            <p>${SELLER.address}</p>
            <p>PH: ${SELLER.shipToPhone}, Email: ${SELLER.shipToEmail}</p>
          </div>
          <div class="border-retro border-r pl-8">
            <p class="font-semibold">GST DETAILS:</p>
            <p>State Code : ${SELLER.stateCode} - ${SELLER.state}</p>
            <p>GSTIN: ${SELLER.gstin}</p>
            <p>PAN NO: ${SELLER.pan}</p>
          </div>
          <div class="border-retro border-r pl-6">
            <p class="font-semibold">Bank Details:</p>
            <p>Bank : ${SELLER.bank.name}</p>
            <p>Account Holder Name : ${SELLER.bank.accountHolder}</p>
            <p>Account number : ${SELLER.bank.accountNo}</p>
            <p>IFSC Code : ${SELLER.bank.ifsc}</p>
          </div>
          <div class="border-retro text-center flex flex-col items-center justify-center gap-1">
            <img src="${dijetIndustrialImage}" class="h-5 object-contain" />
            <p class="text-[0.4rem] leading-snug">
              100% Own Subsidiary of<br />
              <span style="color: #27a645; font-weight: 600;">Dijet</span> Industrial Ltd
            </p>
          </div>
        </div>
      </section>`;

export const HeaderComponent = (quotation) => {
  const customer = quotation.customer || {};
  const customerName = clampText(customer.name, 48);
  const customerAddress = clampText(customer.address, 135);
  const customerPhone = clampText(customer.phone, 22);
  const customerEmail = clampText(customer.email, 42);

  const headerHtml = `
        <section id="header" class="mb-1 pt-5 mx-4">
                <!-- Header Section -->
                <div class="flex justify-between items-center">
                  <div class="w-[12.5rem] h-[3.8rem] flex items-center pl-1">
                    <img
                      src="${dijetIndiaImage}"
                      class="w-full h-full object-contain object-left"
                    />
                  </div>

                  <h1 class="text-2xl font-semibold text-fixed mr-5">QUOTATION</h1>
                </div>
                <div class="mt-3 flex justify-between gap-6">
                  <div class="max-w-[53%] min-w-0">
                    <p class="text-sm text-fixed">Quote for:</p>
                    <div class="pl-2 text-sri leading-snug min-w-0">
                      <p class="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">${customerName}</p>
                      <p style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        ${customerAddress}
                      </p>
                      <div class="whitespace-nowrap overflow-hidden text-ellipsis">
                        <span
                          class="material-symbols-outlined pr-1"
                          style="font-size: 14px; vertical-align: middle"
                        >
                          phone_in_talk </span
                        >${customerPhone} |
                        <span
                          class="material-symbols-outlined pr-1"
                          style="font-size: 14px; vertical-align: middle"
                        >
                          mail </span
                        >${customerEmail}
                      </div>
                    </div>
                  </div>
                  <div class="pr-1 pt-1 text-sri1 grid grid-cols-2 gap-2 shrink-0">
                    <div class="font-semibold">
                      <p>Quotation#</p>
                      <p>Date</p>
                      <p>Valid Till</p>
                      <p>Payment Terms</p>
                      <p>Transport charges</p>
                      <p>Packing Charges</p>
                      ${quotation.remarks ? `<p>Remarks</p>` : ""}
                    </div>
                    <div>
                      <p>:<span> ${quotation.quotationNumber}</span></p>
                      <p>:<span> ${quotation.date}</span></p>
                      <p>:<span> ${quotation.validuntil ? formatDateDDMMMYYYY(new Date(quotation.validuntil)) : "-"}</span></p>
                      <p>:<span> ${quotation.paymentTerms}</span></p>
                      <p>:<span> ${quotation.transportCharges}</span></p>
                      <p>:<span> ${quotation.packingCharges}</span></p>
                      ${quotation.remarks ? `<p>:<span> ${quotation.remarks}</span></p>` : ""}
                    </div>
                  </div>
                </div>
                ${quotation.enquiryDetails ? `
                <div class="text-sri2 pl-10 pt-2">
                  <span class="font-semibold">Enquiry Details :</span>
                  <span> ${quotation.enquiryDetails}</span>
                </div>` : ""}
              </section>`;
  return headerHtml;
};

export const PreFooterComponent = (quotation) => {
  const amountWords = amountInWords(quotation.grosstotal);
  const preFooterHtml = `
  <section>
        <div>
          <div class="mt-5 text-sri flex justify-between pr-8">
            <div class="pl-10 text-sri1 flex-2 pr-2">
              <p>
                <span class="font-semibold text-sri2">Amount in Words:</span>
                ${amountWords}
              </p>
            </div>
            <div
              class="grid grid-cols-2 text-sri2 border-b-2 border-retro pb-4"
            >
              <div class="font-semibold">
                <p>Total (₹)</p>
              </div>
              <div>
                <p>${formatItemNumber(quotation.grosstotal)}</p>
              </div>
            </div>
          </div>
          <div class="text-sri flex justify-between pr-8">
            <div class="mt-4 text-[0.50rem] pl-10">
              <p>
                We trust our offer is in line with your requirement.<br />
                In case of any further information requirement, please do let us
                know. We will be glad to assist you please. <br />Looking
                forward to your valued Purchase Order which will receive the
                best attention from us. <br />Thanking you and with best
                regards,
              </p>
            </div>
            <div class="mt-6 mb-4 text-sri pr-8">
              <p>for DIJET INDIA PVT LTD</p>
              <p class="mt-5 pl-2">Mr. Ravi Sane</p>
            </div>
          </div>
        </div>
      </section>`;
  return preFooterHtml;
};

export const HeadingsComponent = (hasDiscount = false) => {
  const cols = hasDiscount ? "grid-cols-10" : "grid-cols-8";
  const gapClass = hasDiscount ? "gap-2" : "gap-5";
  const discountHeaders = hasDiscount ? "<p>List Price</p><p>Discount</p>" : "";
  return `
<div class="grid ${cols} ${gapClass} text-sri2 text-center border-t-2 border-b-2 border-retro font-semibold py-1 px-2">
  <p>No</p>
  <p class="col-span-4">Item Description</p>
  <p>Quantity</p>
  ${discountHeaders}
  <p>Unit Price</p>
  <p>Total</p>
</div>`;
};
