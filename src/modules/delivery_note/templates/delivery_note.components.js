import loadBase64Image from "../../../utils/loadImage.js";
import { SELLER } from "../../../constants/index.js";

const dijetIndiaImage = loadBase64Image("public/Images/dijet-india-logo.png");

const COMPANY = {
  name: "DIJET INDIA PVT LTD",
  address: SELLER.address,
  phone: SELLER.shipToPhone,
  email: SELLER.shipToEmail,
  gstin: SELLER.gstin,
};

export const DNHeaderComponent = (dn) => `
  <section id="header" class="mb-2 pt-5 mx-4">
    <div class="flex justify-between items-center">
      <img src="${dijetIndiaImage}" class="h-12 scale-[6.75] pl-4" />
      <div class="text-right mr-5">
        <h1 class="text-2xl font-semibold text-fixed">DELIVERY NOTE</h1>
        <span class="text-sri1 text-gray-500">${dn.status || "Pending"}</span>
      </div>
    </div>

    <div class="mt-14 grid grid-cols-2 gap-4 text-sri">
      <!-- From -->
      <div>
        <p class="text-sri2 font-semibold border-b border-retro pb-1 mb-1">FROM</p>
        <p class="font-semibold">${COMPANY.name}</p>
        <p>${COMPANY.address}</p>
        <p>PH: ${COMPANY.phone} | Email: ${COMPANY.email}</p>
        <p>GSTIN: ${COMPANY.gstin}</p>
      </div>
      <!-- To -->
      <div>
        <p class="text-sri2 font-semibold border-b border-retro pb-1 mb-1">TO</p>
        <p class="font-semibold">${dn.customer?.name || "-"}</p>
        <p>${dn.customer?.address || "-"}</p>
        <p>PH: ${dn.customer?.phone || "-"} | Email: ${dn.customer?.email || "-"}</p>
        ${dn.customer?.gstin ? `<p>GSTIN: ${dn.customer.gstin}</p>` : ""}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-4 text-sri1">
      <div class="grid grid-cols-2">
        <div class="font-semibold space-y-0.5">
          <p>DN Number</p>
          <p>Delivery Date</p>
          <p>Dispatched Through</p>
          <p>Vehicle No</p>
        </div>
        <div class="space-y-0.5">
          <p>: ${dn.dnNumber}</p>
          <p>: ${dn.deliveryDate || "-"}</p>
          <p>: ${dn.dispatchedThrough || "-"}</p>
          <p>: ${dn.vehicleNo || "-"}</p>
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-semibold space-y-0.5">
          ${dn.cpoId ? `<p>CPO Number</p>` : ""}
          ${dn.poId ? `<p>PO Number</p>` : ""}
          ${dn.quotationId ? `<p>Quotation No</p>` : ""}
          ${dn.remarks ? `<p>Remarks</p>` : ""}
        </div>
        <div class="space-y-0.5">
          ${dn.cpoId ? `<p>: ${dn.cpoId?.cpoNumber || "-"}</p>` : ""}
          ${dn.poId ? `<p>: ${dn.poId?.poNumber || "-"}</p>` : ""}
          ${dn.quotationId ? `<p>: ${dn.quotationId?.quotationNumber || "-"}</p>` : ""}
          ${dn.remarks ? `<p>: ${dn.remarks}</p>` : ""}
        </div>
      </div>
    </div>
  </section>`;

export const DNHeadingsComponent = `
  <div class="grid grid-cols-12 gap-1 text-sri2 text-center border-t-2 border-b-2 border-retro font-semibold py-1 px-2 mx-2 mt-3">
    <p>No</p>
    <p class="col-span-4 text-left">Item Description</p>
    <p>HSN Code</p>
    <p class="col-span-2">Ordered Qty</p>
    <p class="col-span-2">Delivered Qty</p>
    <p>Unit</p>
    <p>Remarks</p>
  </div>`;

export const DNItemsComponent = (items) =>
  items
    .map(
      (item, index) => `
    <div class="grid grid-cols-12 gap-1 text-sri1 text-center border-b border-gray-200 py-1.5 px-2 mx-2">
      <p>${index + 1}</p>
      <p class="col-span-4 text-left font-medium">${item.description || "-"}</p>
      <p>${item.hsnCode || "-"}</p>
      <p class="col-span-2">${item.orderedQty} ${item.unit || "pcs"}</p>
      <p class="col-span-2 font-semibold ${item.deliveredQty < item.orderedQty ? "text-amber-600" : "text-green-700"}">${item.deliveredQty} ${item.unit || "pcs"}</p>
      <p>${item.unit || "pcs"}</p>
      <p class="text-left text-[0.6rem]">${item.remarks || "-"}</p>
    </div>`
    )
    .join("");

export const DNPreFooterComponent = (dn) => {
  const totalOrdered = dn.items.reduce((s, i) => s + i.orderedQty, 0);
  const totalDelivered = dn.items.reduce((s, i) => s + i.deliveredQty, 0);
  return `
  <section class="mx-4 mt-4">
    <div class="flex justify-end pr-4 text-sri1 mb-3">
      <div class="grid grid-cols-2 gap-4 border-b-2 border-retro pb-3">
        <p class="font-semibold">Total Ordered</p><p class="text-right">${totalOrdered} pcs</p>
        <p class="font-semibold">Total Delivered</p><p class="text-right font-semibold ${totalDelivered < totalOrdered ? "text-amber-600" : "text-green-700"}">${totalDelivered} pcs</p>
      </div>
    </div>
    <div class="mt-4 text-sri text-center">
      <p class="font-semibold text-sri2">Status: <span class="${dn.status === "Invoiced" ? "text-green-700" : "text-amber-600"}">${dn.status}</span></p>
    </div>
    <div class="mt-6 flex justify-end pr-4 text-sri">
      <div class="text-center">
        <p>For Dijet India Pvt Ltd</p>
        <p class="mt-8 border-t border-gray-400 pt-1 text-[0.55rem] text-gray-500">Authorized Signatory</p>
      </div>
    </div>
    <p class="text-center text-[0.45rem] text-gray-400 mt-4">This is a computer generated document | Page 1 of 1</p>
  </section>`;
};

export const DNFooterComponent = `
  <section id="footer" class="text-[0.45rem] mt-auto pb-3 mx-4 border-t border-retro pt-2">
    <div class="grid grid-cols-3">
      <div class="border-r border-retro">
        <p class="font-semibold">DIJET INDIA PVT LTD</p>
        <p>${SELLER.address}</p>
        <p>PH: ${SELLER.shipToPhone} | Email: ${SELLER.shipToEmail}</p>
      </div>
      <div class="border-r border-retro pl-4">
        <p class="font-semibold">GST DETAILS:</p>
        <p>State Code : ${SELLER.stateCode} - ${SELLER.state}</p>
        <p>GSTIN : ${SELLER.gstin}</p>
        <p>PAN NO: ${SELLER.pan}</p>
      </div>
      <div class="pl-4">
        <p class="font-semibold">Bank Details:</p>
        <p>Bank : ${SELLER.bank.name} | A/C: ${SELLER.bank.accountNo}</p>
        <p>IFSC : ${SELLER.bank.ifsc}</p>
      </div>
    </div>
  </section>`;
