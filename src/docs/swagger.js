import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Dijet India Pvt Ltd — Document Chain API",
      version: "1.0.0",
      description:
        "Backend API for Dijet India Pvt Ltd's billing and procurement workflow. " +
        "Manages the full document chain: Quotation → Customer PO → Purchase Order → Delivery Note → Invoice.",
      contact: { name: "Dijet India Pvt Ltd", email: "[TODO: EMAIL]" },
    },
    servers: [
      { url: "http://localhost:5001", description: "Local Development" },
      { url: process.env.API_URL || "", description: "Production" },
    ],
    tags: [
      { name: "Health", description: "Server health check" },
      { name: "Items", description: "Product catalog management" },
      { name: "Customers", description: "Customer management" },
      { name: "Vendors", description: "Vendor management" },
      { name: "Quotations", description: "Customer-facing quotations" },
      { name: "Customer POs", description: "Customer Purchase Orders — created from quotations, tracks delivery and invoicing" },
      { name: "Purchase Orders", description: "Vendor-facing procurement orders — grouped from Customer POs" },
      { name: "GRN", description: "Goods Receipt Notes — records received goods, updates stock and PO status" },
      { name: "Delivery Notes", description: "Dispatch documents with partial delivery tracking" },
      { name: "Invoices", description: "Tax invoices generated from Delivery Notes" },
      { name: "PDF", description: "Generate PDF for any document type" },
      { name: "Debtors", description: "Accounts receivable — track payments against invoices" },
      { name: "Creditors", description: "Accounts payable — track payments against purchase orders" },
      { name: "Reports", description: "Business dashboard, sales analytics, top customers/vendors, stock and pending reports" },
      { name: "Expenses", description: "Operational expenses — salaries, rent, utilities etc. Used in P&L reporting" },
      { name: "Investments", description: "Capital investments and fixed assets tracking (admin only)" },
      { name: "Export", description: "Download data as Excel (.xlsx)" },
      { name: "Settings", description: "Business settings — opening balance and financial configuration (admin)" },
    ],
    components: {
      schemas: {
        // ─── Shared ──────────────────────────────────────────────────
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Resource not found" },
          },
        },
        PaymentInput: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: { type: "number", example: 5000 },
            mode: { type: "string", enum: ["Cash", "Cheque", "Bank Transfer", "UPI", "Other"], default: "Bank Transfer" },
            reference: { type: "string", example: "TXN123456" },
            notes: { type: "string" },
          },
        },
        // ─── Item ────────────────────────────────────────────────────
        Item: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "BNM-080-TS" },
            image: { type: "string", example: "https://res.cloudinary.com/..." },
            make: { type: "string", example: "Dijet Japan" },
            itemType: { type: "string", enum: ["Cutting Tools", "Measuring Instruments", "Machine Parts", "Abrasives", "Workholding", "Toolholders", "Coolants & Lubricants", "Safety Equipment", "Other"] },
            hsnCode: { type: "string", example: "82079090", description: "Auto-filled from itemType if not provided" },
            application: { type: "string" },
            public_id: { type: "string" },
            stock: { type: "number", example: 10 },
            listPrice: { type: "number", example: 1500, description: "Standard catalogue price" },
            maxDiscountPercent: { type: "number", example: 15, description: "Max discount allowed; quotation exceeding this triggers Pending Approval" },
            lastBuyingCost: { type: "number", example: 980, description: "Last unit rate paid to vendor (auto-updated on GRN)" },
            pendingStock: { type: "number", description: "Computed: units on open POs not yet received" },
          },
        },
        // ─── Customer ────────────────────────────────────────────────
        Customer: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string", example: "Easwari Moulds & Dies Pvt Ltd" },
            email: { type: "string", example: "sales@emdies.in" },
            phone: { type: "string", example: "8939995262" },
            address: { type: "string" },
            gstin: { type: "string", example: "33EZQPM5268D2Z0" },
            state: { type: "string", example: "Tamil Nadu" },
            country: { type: "string", example: "India" },
            pincode: { type: "string", example: "602118" },
          },
        },
        // ─── Expense ─────────────────────────────────────────────────
        ExpenseInput: {
          type: "object",
          required: ["category", "amount", "description"],
          properties: {
            category: { type: "string", enum: ["Salary", "Rent", "Utilities", "Transport", "Maintenance", "Other"], example: "Salary" },
            amount: { type: "number", example: 25000 },
            description: { type: "string", example: "March 2026 salary — Sridhar" },
            expenseDate: { type: "string", example: "26-MAR-26", description: "Defaults to today if omitted" },
            paidTo: { type: "string", example: "Sridhar R" },
            referenceNo: { type: "string", example: "TXN9876" },
            remarks: { type: "string" },
          },
        },
        Expense: {
          type: "object",
          properties: {
            _id: { type: "string" },
            category: { type: "string", enum: ["Salary", "Rent", "Utilities", "Transport", "Maintenance", "Other"] },
            amount: { type: "number" },
            description: { type: "string" },
            expenseDate: { type: "string" },
            paidTo: { type: "string" },
            referenceNo: { type: "string" },
            remarks: { type: "string" },
            createdAt: { type: "string" },
          },
        },
        // ─── Investment ──────────────────────────────────────────────
        Settings: {
          type: "object",
          properties: {
            openingCash: { type: "number", example: 250000, description: "Cash/capital the business had when operations started" },
            asOf: { type: "string", example: "2024-04-01", description: "Date the opening balance is as of (YYYY-MM-DD)" },
            notes: { type: "string", example: "Opening balance as on business start date" },
          },
        },
        OpeningBalanceInput: {
          type: "object",
          required: ["openingCash"],
          properties: {
            openingCash: { type: "number", example: 250000 },
            asOf: { type: "string", example: "2024-04-01" },
            notes: { type: "string" },
          },
        },
        InvestmentInput: {
          type: "object",
          required: ["name", "category", "amount", "purchaseDate"],
          properties: {
            name: { type: "string", example: "CNC Lathe Machine" },
            category: { type: "string", enum: ["Equipment", "Machinery", "Vehicle", "Furniture", "Software", "Land & Building", "Other"] },
            amount: { type: "number", example: 450000 },
            purchaseDate: { type: "string", example: "01-APR-2025" },
            description: { type: "string" },
            vendor: { type: "string", example: "HAAS Automation" },
            depreciationRate: { type: "number", example: 15, description: "Annual depreciation %" },
            status: { type: "string", enum: ["Active", "Disposed", "Under Maintenance"], default: "Active" },
            referenceNo: { type: "string" },
            remarks: { type: "string" },
          },
        },
        // ─── Vendor ──────────────────────────────────────────────────
        Vendor: {
          type: "object",
          properties: {
            _id: { type: "string" },
            vendorAccount: { type: "string", example: "V-001" },
            name: { type: "string", example: "ICON INDUSTRIAL SOLUTIONS" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            gstin: { type: "string" },
            pan: { type: "string" },
            state: { type: "string" },
            stateCode: { type: "string" },
            paymentTerms: { type: "string", example: "60 Days" },
          },
        },
        VendorInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            address: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            gstin: { type: "string" },
            pan: { type: "string" },
            state: { type: "string" },
            stateCode: { type: "string" },
            paymentTerms: { type: "string" },
          },
        },
        // ─── Quotation ───────────────────────────────────────────────
        QuotationItem: {
          type: "object",
          required: ["itemId", "listprice", "quantity"],
          properties: {
            itemId: { type: "string", description: "MongoDB ObjectId of Item" },
            quantity: { type: "number", example: 4 },
            listprice: { type: "number", example: 2165 },
            discountPercent: { type: "number", default: 0, description: "Discount % — unitPrice auto-calculated as listPrice × (1 - discount/100)" },
            notes: { type: "string" },
            delivery: { type: "string", example: "3-4 Working Days" },
            tax: { type: "string", example: "Tax extra 18%" },
            hsncode: { type: "string", example: "82079090" },
          },
        },
        CustomerInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Easwari Moulds & Dies Pvt Ltd" },
            email: { type: "string", example: "sales@emdies.in" },
            phone: { type: "string", example: "8939995262" },
            address: { type: "string" },
            gstin: { type: "string", example: "33EZQPM5268D2Z0" },
            state: { type: "string", example: "Tamil Nadu" },
            country: { type: "string", example: "India" },
            pincode: { type: "string", example: "602118" },
          },
        },
        QuotationInput: {
          type: "object",
          required: ["customer", "items", "currencyrate", "currencycode", "dutyPercent", "freightPercent", "validuntil"],
          properties: {
            customer: { type: "string", description: "Customer ObjectId — create customer first via POST /api/customers" },
            items: { type: "array", items: { $ref: "#/components/schemas/QuotationItem" } },
            currencyrate: { type: "number", example: 1 },
            currencycode: { type: "string", example: "INR" },
            dutyPercent: { type: "number", example: 0 },
            freightPercent: { type: "number", example: 0 },
            totalDiscountPercent: { type: "number", default: 0 },
            paymentTerms: { type: "string", example: "Against Proforma" },
            transportCharges: { type: "number", default: 0 },
            packingCharges: { type: "number", default: 0 },
            enquiryDetails: { type: "string" },
            validuntil: { type: "string", example: "30-APR-2026" },
          },
        },
        Quotation: {
          type: "object",
          properties: {
            _id: { type: "string" },
            quotationNumber: { type: "string", example: "QT-001/26-27" },
            customer: { $ref: "#/components/schemas/Customer" },
            items: { type: "array", items: { type: "object" } },
            date: { type: "string", example: "17-MAR-2026" },
            validuntil: { type: "string" },
            totalnet: { type: "number" },
            grosstotal: { type: "number" },
            status: { type: "string", enum: ["Active", "Converted", "Modified", "Closed"] },
          },
        },
        // ─── Customer PO ──────────────────────────────────────────────
        CPOItem: {
          type: "object",
          required: ["description", "orderedQty"],
          properties: {
            itemId: { type: "string", description: "Optional MongoDB ObjectId of Item catalog" },
            description: { type: "string", example: "BNM-080-TS Mirror Ball Insert" },
            make: { type: "string" },
            hsnCode: { type: "string" },
            unit: { type: "string", default: "pcs" },
            unitPrice: { type: "number", example: 1500, description: "Selling price to customer" },
            orderedQty: { type: "number", example: 10 },
            vendorId: { type: "string", description: "Vendor ObjectId for PO grouping" },
            requiredDate: { type: "string" },
            remarks: { type: "string" },
          },
        },
        CustomerPOInput: {
          type: "object",
          required: ["customer", "items"],
          properties: {
            customer: { type: "string", description: "Customer ObjectId" },
            items: { type: "array", items: { $ref: "#/components/schemas/CPOItem" } },
            remarks: { type: "string" },
          },
        },
        FromQuotationInput: {
          type: "object",
          properties: {
            additionalItems: { type: "array", items: { $ref: "#/components/schemas/CPOItem" } },
            remarks: { type: "string" },
          },
        },
        CustomerPO: {
          type: "object",
          properties: {
            _id: { type: "string" },
            cpoNumber: { type: "string", example: "CPO-2025-001", description: "Manually provided by user — must be unique" },
            quotationId: { type: "string" },
            customer: { $ref: "#/components/schemas/Customer" },
            items: { type: "array", items: { type: "object" } },
            status: {
              type: "string",
              enum: ["Confirmed", "Partially Delivered", "Delivered", "Partially Invoiced", "Invoiced", "Closed"],
            },
          },
        },
        // ─── Purchase Order ───────────────────────────────────────────
        POItem: {
          type: "object",
          required: ["specification", "quantity", "listRate"],
          properties: {
            itemId: { type: "string" },
            specification: { type: "string", example: "SPMT100415ZPER-SM, JC7550" },
            quantity: { type: "number", example: 900 },
            uom: { type: "string", default: "PCS" },
            listRate: { type: "number", example: 278 },
            discount: { type: "number", default: 0 },
          },
        },
        PurchaseOrderInput: {
          type: "object",
          required: ["vendor", "items"],
          properties: {
            vendor: { type: "string", description: "Vendor ObjectId" },
            cpoId: { type: "string", description: "Customer PO ObjectId (optional)" },
            items: { type: "array", items: { $ref: "#/components/schemas/POItem" } },
            currency: { type: "string", default: "INR" },
            paymentTerms: { type: "string" },
            vendorQuoteNo: { type: "string" },
            buyerReqNo: { type: "string" },
          },
        },
        FromCPOInput: {
          type: "object",
          properties: {
            paymentTerms: { type: "string" },
            itemRates: {
              type: "object",
              description: "Map of CPO item _id → list rate",
              example: { "cpoItemId1": 278, "cpoItemId2": 430 },
            },
          },
        },
        PurchaseOrder: {
          type: "object",
          properties: {
            _id: { type: "string" },
            poNumber: { type: "string", example: "RE001/25-26" },
            vendor: { $ref: "#/components/schemas/Vendor" },
            items: { type: "array", items: { type: "object" } },
            totalAmount: { type: "number" },
            amountInWords: { type: "string" },
            status: {
              type: "string",
              enum: ["Open", "Partially Received", "Closed", "Cancelled"],
            },
          },
        },
        // ─── Delivery Note ─────────────────────────────────────────
        DCItemInput: {
          type: "object",
          required: ["description", "orderedQty", "deliveredQty"],
          properties: {
            itemId: { type: "string" },
            description: { type: "string" },
            hsnCode: { type: "string" },
            unit: { type: "string", default: "pcs" },
            orderedQty: { type: "number", example: 10 },
            deliveredQty: { type: "number", example: 5, description: "Supports partial delivery" },
            remarks: { type: "string" },
          },
        },
        DCFromCPOItemInput: {
          type: "object",
          required: ["cpoItemId", "deliveredQty"],
          properties: {
            cpoItemId: { type: "string", description: "CPO item subdocument _id" },
            deliveredQty: { type: "number", example: 5 },
            remarks: { type: "string" },
          },
        },
        DeliveryNoteInput: {
          type: "object",
          required: ["customer", "items"],
          properties: {
            customer: { type: "string" },
            cpoId: { type: "string", description: "Customer PO ObjectId (optional)" },
            poId: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/DCItemInput" } },
            dispatchedThrough: { type: "string", example: "By Hand" },
            vehicleNo: { type: "string" },
            deliveryDate: { type: "string" },
            remarks: { type: "string" },
          },
        },
        FromCPODCInput: {
          type: "object",
          required: ["items"],
          properties: {
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/DCFromCPOItemInput" },
              description: "Each CPO item to deliver — use cpoItemId from the CPO's items array",
            },
            dispatchedThrough: { type: "string" },
            vehicleNo: { type: "string" },
            deliveryDate: { type: "string" },
            remarks: { type: "string" },
          },
        },
        DeliveryNote: {
          type: "object",
          properties: {
            _id: { type: "string" },
            dnNumber: { type: "string", example: "DN-001/26-27" },
            customer: { $ref: "#/components/schemas/Customer" },
            items: { type: "array", items: { type: "object" } },
            status: { type: "string", enum: ["Pending", "Partially Invoiced", "Invoiced"] },
          },
        },
        // ─── Invoice ──────────────────────────────────────────────────
        InvoiceInput: {
          type: "object",
          required: ["deliveryNoteId"],
          properties: {
            deliveryNoteId: { type: "string", description: "DeliveryNote ObjectId" },
            itemRates: {
              type: "object",
              description: "Map of DC item _id → unit rate",
              example: { "dcItemId1": 1242, "dcItemId2": 628.19 },
            },
            itemDiscounts: {
              type: "object",
              description: "Map of DC item _id → discount %",
              example: { "dcItemId1": 0 },
            },
            gstRate: { type: "number", default: 18, description: "Total GST rate (18 = SGST9+CGST9 or IGST18)" },
            paymentTerms: { type: "string", example: "30 Days" },
            buyerOrderNo: { type: "string" },
            buyerOrderDate: { type: "string" },
            dispatchDocNo: { type: "string" },
            eWayBillNo: { type: "string" },
            deliveryNote: { type: "string" },
            dispatchedThrough: { type: "string" },
          },
        },
        Invoice: {
          type: "object",
          properties: {
            _id: { type: "string" },
            invoiceNumber: { type: "string", example: "RE/001/25-26" },
            deliveryNoteId: { type: "string" },
            customer: { $ref: "#/components/schemas/Customer" },
            invoiceDate: { type: "string" },
            items: { type: "array", items: { type: "object" } },
            taxSummary: {
              type: "object",
              properties: {
                totalBeforeTax: { type: "number" },
                totalSGST: { type: "number" },
                totalCGST: { type: "number" },
                totalIGST: { type: "number" },
                totalTax: { type: "number" },
                totalAfterTax: { type: "number" },
              },
            },
            status: { type: "string", enum: ["Draft", "Sent", "Paid", "Partially Paid", "Overdue"] },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);

// ─── Inline path definitions ────────────────────────────────────────────────
swaggerSpec.paths = {
  // ── Health ──────────────────────────────────────────────────────────────
  "/health": {
    get: {
      tags: ["Health"],
      summary: "Server health check",
      responses: {
        200: { description: "Server is running", content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, uptime: { type: "number" }, timestamp: { type: "string" } } } } } },
      },
    },
  },

  // ── Items ────────────────────────────────────────────────────────────────
  "/api/items": {
    get: {
      tags: ["Items"],
      summary: "Get all items",
      responses: { 200: { description: "List of items", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Item" } } } } } },
    },
    post: {
      tags: ["Items"],
      summary: "Create a new item with image upload",
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", required: ["name", "make"], properties: { name: { type: "string" }, make: { type: "string" }, hsnCode: { type: "string", example: "82079090" }, application: { type: "string" }, image: { type: "string", format: "binary" } } } } } },
      responses: { 201: { description: "Item created" }, 400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } },
    },
  },
  "/api/items/{id}": {
    get: {
      tags: ["Items"], summary: "Get item by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Item found" }, 404: { description: "Not found" } },
    },
    put: {
      tags: ["Items"], summary: "Update item (optionally replace image)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "multipart/form-data": { schema: { type: "object", properties: { name: { type: "string" }, make: { type: "string" }, hsnCode: { type: "string", example: "82079090" }, application: { type: "string" }, image: { type: "string", format: "binary" } } } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Items"], summary: "Delete item and its Cloudinary image",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── Vendors ──────────────────────────────────────────────────────────────
  "/api/vendors": {
    get: {
      tags: ["Vendors"], summary: "Get all vendors",
      responses: { 200: { description: "List of vendors", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Vendor" } } } } } },
    },
    post: {
      tags: ["Vendors"], summary: "Create a new vendor",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VendorInput" } } } },
      responses: { 201: { description: "Vendor created", content: { "application/json": { schema: { $ref: "#/components/schemas/Vendor" } } } }, 400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } } },
    },
  },
  "/api/vendors/{id}": {
    get: {
      tags: ["Vendors"], summary: "Get vendor by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Vendor found" }, 404: { description: "Not found" } },
    },
    put: {
      tags: ["Vendors"], summary: "Update vendor",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/VendorInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Vendors"], summary: "Delete vendor",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── Customers ────────────────────────────────────────────────────────────
  "/api/customers": {
    get: {
      tags: ["Customers"], summary: "Get all customers",
      responses: { 200: { description: "List of customers", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Customer" } } } } } },
    },
    post: {
      tags: ["Customers"], summary: "Create a new customer",
      description: "Creates a standalone customer. If email is provided, it must be unique. Customer ID is then passed to POST /api/quotations.",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerInput" } } } },
      responses: {
        201: { description: "Customer created", content: { "application/json": { schema: { $ref: "#/components/schemas/Customer" } } } },
        409: { description: "Customer with this email already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        400: { description: "Name is required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/customers/{id}": {
    get: {
      tags: ["Customers"], summary: "Get customer by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Customer found" }, 404: { description: "Not found" } },
    },
    put: {
      tags: ["Customers"], summary: "Update customer details",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Customer" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Customers"], summary: "Delete customer",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── Quotations ───────────────────────────────────────────────────────────
  "/api/quotations": {
    get: {
      tags: ["Quotations"], summary: "Get all quotations",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of quotations", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Quotation" } } } } } },
    },
    post: {
      tags: ["Quotations"], summary: "Create a new quotation (auto-creates customer if new)",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/QuotationInput" } } } },
      responses: { 201: { description: "Quotation created", content: { "application/json": { schema: { $ref: "#/components/schemas/Quotation" } } } }, 400: { description: "Validation error" } },
    },
  },
  "/api/quotations/{id}": {
    get: {
      tags: ["Quotations"], summary: "Get quotation by ID (populates customer + items)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Quotation found" } },
    },
    put: {
      tags: ["Quotations"], summary: "Update quotation",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/QuotationInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Quotations"], summary: "Delete quotation",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },
  "/api/quotations/{id}/approve": {
    patch: {
      tags: ["Quotations"], summary: "Approve a quotation (Admin only)",
      description: "Changes status from 'Pending Approval' to 'Active'. Returns 400 if quotation is not in Pending Approval state.",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Quotation approved — status set to Active" },
        400: { description: "Quotation not in Pending Approval state" },
        403: { description: "Admin access required" },
        404: { description: "Not found" },
      },
    },
  },

  // ── Customer POs ─────────────────────────────────────────────────────────
  "/api/customer-po": {
    get: {
      tags: ["Customer POs"], summary: "Get all Customer POs",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of CPOs with pendingDeliveryQty and pendingInvoiceQty per item", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/CustomerPO" } } } } } },
    },
    post: {
      tags: ["Customer POs"], summary: "Create a standalone Customer PO",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerPOInput" } } } },
      responses: { 201: { description: "CPO created" }, 400: { description: "Validation error" } },
    },
  },
  "/api/customer-po/from-quotation/{quotationId}": {
    post: {
      tags: ["Customer POs"],
      summary: "Create CPO from a Quotation — inherits all items and unitPrice, sets Quotation to 'Converted'",
      parameters: [{ name: "quotationId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        content: { "application/json": { schema: { $ref: "#/components/schemas/FromQuotationInput" } } },
        description: "Optional: add extra items not in the quotation",
      },
      responses: { 201: { description: "CPO created from quotation" }, 404: { description: "Quotation not found" } },
    },
  },
  "/api/customer-po/{id}": {
    get: {
      tags: ["Customer POs"], summary: "Get CPO by ID (includes derived pendingDeliveryQty / pendingInvoiceQty)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "CPO found" } },
    },
    put: {
      tags: ["Customer POs"], summary: "Update CPO (assign vendors, update status, etc.)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerPOInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Customer POs"], summary: "Delete CPO",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  "/api/customer-po/{id}/delivery-notes": {
    get: {
      tags: ["Customer POs"],
      summary: "Get all Delivery Notes raised against a CPO",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "CPO ObjectId" }],
      responses: {
        200: { description: "List of DCs for this CPO", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } },
        404: { description: "CPO not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/customer-po/{id}/invoices": {
    get: {
      tags: ["Customer POs"],
      summary: "Get all Invoices raised against a CPO",
      description: "Returns all invoices linked to DCs of this CPO, plus summary totals: invoiceCount, totalInvoiced, totalCollected, totalOutstanding.",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "CPO ObjectId" }],
      responses: {
        200: {
          description: "Invoice summary + list for this CPO",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { cpoId: { type: "string" }, invoiceCount: { type: "integer" }, totalInvoiced: { type: "number" }, totalCollected: { type: "number" }, totalOutstanding: { type: "number" }, invoices: { type: "array", items: { type: "object" } } } } } } } },
        },
        404: { description: "CPO not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },

  // ── Purchase Orders ──────────────────────────────────────────────────────
  "/api/purchase-orders": {
    get: {
      tags: ["Purchase Orders"], summary: "Get all purchase orders",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of POs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/PurchaseOrder" } } } } } },
    },
    post: {
      tags: ["Purchase Orders"], summary: "Create a standalone Purchase Order",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PurchaseOrderInput" } } } },
      responses: { 201: { description: "PO created" }, 400: { description: "Validation error" } },
    },
  },
  "/api/purchase-orders/from-cpo/{cpoId}": {
    post: {
      tags: ["Purchase Orders"],
      summary: "Auto-generate POs from CPO — groups items by vendorId, creates one PO per vendor",
      parameters: [{ name: "cpoId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/FromCPOInput" } } },
      },
      responses: { 201: { description: "Array of created POs" }, 400: { description: "No vendor-assigned items found in CPO" } },
    },
  },
  "/api/purchase-orders/{id}": {
    get: {
      tags: ["Purchase Orders"], summary: "Get PO by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "PO found" } },
    },
    put: {
      tags: ["Purchase Orders"], summary: "Update PO (recalculates totals if items changed)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/PurchaseOrderInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Purchase Orders"], summary: "Delete PO",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  "/api/purchase-orders/{id}/grns": {
    get: {
      tags: ["Purchase Orders"],
      summary: "Get all GRNs received against a PO",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "PO ObjectId" }],
      responses: {
        200: { description: "List of GRNs for this PO", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object" } } } } } } },
        404: { description: "PO not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },

  // ── GRN ──────────────────────────────────────────────────────────────────
  "/api/grn": {
    get: {
      tags: ["GRN"], summary: "Get all GRNs",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of GRNs" } },
    },
    post: {
      tags: ["GRN"], summary: "Create a GRN — increments item stock, updates PO receivedQty and status",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["poId", "items"],
              properties: {
                poId: { type: "string", description: "PurchaseOrder ObjectId" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["itemId", "receivedQty"],
                    properties: {
                      itemId: { type: "string" },
                      description: { type: "string" },
                      receivedQty: { type: "number", example: 10 },
                      remarks: { type: "string" },
                    },
                  },
                },
                receivedDate: { type: "string" },
                remarks: { type: "string" },
              },
            },
          },
        },
      },
      responses: { 201: { description: "GRN created" }, 400: { description: "PO not found or cancelled" } },
    },
  },
  "/api/grn/{id}": {
    get: {
      tags: ["GRN"], summary: "Get GRN by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "GRN found" } },
    },
    delete: {
      tags: ["GRN"], summary: "Delete GRN (does not reverse stock)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── Delivery Notes ────────────────────────────────────────────────────
  "/api/delivery-notes": {
    get: {
      tags: ["Delivery Notes"], summary: "Get all delivery notes",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of DCs", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/DeliveryNote" } } } } } },
    },
    post: {
      tags: ["Delivery Notes"], summary: "Create a standalone Delivery Note",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryNoteInput" } } } },
      responses: { 201: { description: "DC created with status 'Pending'" }, 400: { description: "Validation error" } },
    },
  },
  "/api/delivery-notes/from-cpo/{cpoId}": {
    post: {
      tags: ["Delivery Notes"],
      summary: "Create DC from CPO — validates stock, deducts stock, updates CPO deliveredQty and status",
      parameters: [{ name: "cpoId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/FromCPODCInput" } } },
      },
      responses: { 201: { description: "DC created" }, 400: { description: "CPO not found or insufficient stock" } },
    },
  },
  "/api/delivery-notes/{id}": {
    get: {
      tags: ["Delivery Notes"], summary: "Get DC by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "DC found" } },
    },
    put: {
      tags: ["Delivery Notes"], summary: "Update DC",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryNoteInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Delivery Notes"], summary: "Delete DC",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── Invoices ─────────────────────────────────────────────────────────────
  "/api/invoices": {
    get: {
      tags: ["Invoices"], summary: "Get all invoices",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2027 }, description: "FY ending year — 2027 returns Apr 2026–Mar 2027. Defaults to current FY." }],
      responses: { 200: { description: "List of invoices", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Invoice" } } } } } },
    },
    post: {
      tags: ["Invoices"],
      summary: "Create Invoice from a Delivery Note — bills only deliveredQty. Auto-applies SGST+CGST (same state) or IGST (different state)",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/InvoiceInput" } } } },
      responses: { 201: { description: "Invoice created", content: { "application/json": { schema: { $ref: "#/components/schemas/Invoice" } } } }, 400: { description: "deliveryNoteId required or DC not found" } },
    },
  },
  "/api/invoices/{id}": {
    get: {
      tags: ["Invoices"], summary: "Get invoice by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Invoice found" } },
    },
    put: {
      tags: ["Invoices"], summary: "Update invoice status or fields",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/InvoiceInput" } } } },
      responses: { 200: { description: "Updated" } },
    },
    delete: {
      tags: ["Invoices"], summary: "Delete invoice",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" } },
    },
  },

  // ── PDF Generation ───────────────────────────────────────────────────────
  "/api/pdf/quotation/{id}": {
    get: {
      tags: ["PDF"], summary: "Download Quotation PDF",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "PDF file", content: { "application/pdf": {} } }, 500: { description: "Generation failed" } },
    },
  },
  "/api/pdf/purchase-order/{id}": {
    get: {
      tags: ["PDF"], summary: "Download Purchase Order PDF",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "PDF file", content: { "application/pdf": {} } } },
    },
  },
  "/api/pdf/delivery-note/{id}": {
    get: {
      tags: ["PDF"], summary: "Download Delivery Note PDF",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "PDF file", content: { "application/pdf": {} } } },
    },
  },
  "/api/pdf/invoice/{id}": {
    get: {
      tags: ["PDF"], summary: "Download Tax Invoice PDF",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "PDF file", content: { "application/pdf": {} } } },
    },
  },

  // ── Debtors (Accounts Receivable) ────────────────────────────────────────
  "/api/debtors": {
    get: {
      tags: ["Debtors"],
      summary: "Get all invoices with outstanding balance",
      description: "Returns invoices where status is Draft, Sent, Partially Paid, or Overdue.",
      responses: {
        200: {
          description: "List of outstanding invoices",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { _id: { type: "string" }, invoiceNumber: { type: "string" }, customer: { $ref: "#/components/schemas/Customer" }, totalAmount: { type: "number" }, amountPaid: { type: "number" }, balanceDue: { type: "number" }, status: { type: "string" }, daysOverdue: { type: "number" } } } } } } } },
        },
      },
    },
  },
  "/api/debtors/summary": {
    get: {
      tags: ["Debtors"],
      summary: "Get accounts receivable summary totals",
      responses: {
        200: {
          description: "Debtors summary",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { totalInvoiced: { type: "number" }, totalCollected: { type: "number" }, totalOutstanding: { type: "number" }, totalOverdue: { type: "number" }, overdueCount: { type: "number" }, totalInvoicesCount: { type: "number" }, paidCount: { type: "number" } } } } } } },
        },
      },
    },
  },
  "/api/debtors/{invoiceId}": {
    get: {
      tags: ["Debtors"],
      summary: "Get payment history for a single invoice",
      parameters: [{ name: "invoiceId", in: "path", required: true, schema: { type: "string" }, description: "Invoice ObjectId" }],
      responses: {
        200: { description: "Invoice payment details" },
        404: { description: "Invoice not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/debtors/{invoiceId}/payment": {
    post: {
      tags: ["Debtors"],
      summary: "Record a payment against an invoice",
      description: "Auto-updates invoice status: Paid (fully settled) or Partially Paid. Rejects overpayment.",
      parameters: [{ name: "invoiceId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentInput" } } } },
      responses: {
        200: { description: "Payment recorded, updated invoice returned" },
        400: { description: "Invalid amount, already paid, or overpayment", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        404: { description: "Invoice not found" },
      },
    },
  },

  // ── Creditors (Accounts Payable) ─────────────────────────────────────────
  "/api/creditors": {
    get: {
      tags: ["Creditors"],
      summary: "Get all purchase orders with outstanding balance",
      description: "Returns POs (excluding Cancelled) where amountPaid < totalAmount.",
      responses: {
        200: {
          description: "List of outstanding purchase orders",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { _id: { type: "string" }, poNumber: { type: "string" }, vendor: { $ref: "#/components/schemas/Vendor" }, totalAmount: { type: "number" }, amountPaid: { type: "number" }, balanceDue: { type: "number" }, status: { type: "string" }, daysOverdue: { type: "number" } } } } } } } },
        },
      },
    },
  },
  "/api/creditors/summary": {
    get: {
      tags: ["Creditors"],
      summary: "Get accounts payable summary totals",
      responses: {
        200: {
          description: "Creditors summary",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { totalOrdered: { type: "number" }, totalPaid: { type: "number" }, totalOutstanding: { type: "number" }, totalOverdue: { type: "number" }, overdueCount: { type: "number" }, totalPOsCount: { type: "number" }, fullyPaidCount: { type: "number" } } } } } } },
        },
      },
    },
  },
  "/api/creditors/{poId}": {
    get: {
      tags: ["Creditors"],
      summary: "Get payment history for a single purchase order",
      parameters: [{ name: "poId", in: "path", required: true, schema: { type: "string" }, description: "PurchaseOrder ObjectId" }],
      responses: {
        200: { description: "PO payment details" },
        404: { description: "Purchase Order not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/creditors/{poId}/payment": {
    post: {
      tags: ["Creditors"],
      summary: "Record a payment against a purchase order",
      description: "Rejects payment on Cancelled POs. Rejects overpayment.",
      parameters: [{ name: "poId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentInput" } } } },
      responses: {
        200: { description: "Payment recorded, updated PO returned" },
        400: { description: "Invalid amount, cancelled PO, or overpayment", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        404: { description: "Purchase Order not found" },
      },
    },
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  "/api/reports/dashboard": {
    get: {
      tags: ["Reports"],
      summary: "Business dashboard — full financial overview",
      description: "Returns receivables, payables, gross profit estimate, net cashflow, and pipeline counts for all document types.",
      responses: {
        200: {
          description: "Dashboard data",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { receivables: { type: "object", properties: { totalInvoiced: { type: "number" }, totalCollected: { type: "number" }, totalOutstanding: { type: "number" } } }, payables: { type: "object", properties: { totalOrdered: { type: "number" }, totalPaid: { type: "number" }, totalOutstanding: { type: "number" } } }, profitEstimate: { type: "object", properties: { grossProfit: { type: "number" }, netCashflow: { type: "number" } } }, pipeline: { type: "object" } } } } } } },
        },
      },
    },
  },
  "/api/reports/sales/monthly": {
    get: {
      tags: ["Reports"],
      summary: "Monthly sales report",
      description: "Returns month-by-month invoiced, collected, and outstanding amounts. Defaults to current year.",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2026 }, description: "Calendar year (defaults to current year)" }],
      responses: {
        200: {
          description: "Monthly sales breakdown",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { year: { type: "integer" }, monthly: { type: "array", items: { type: "object", properties: { month: { type: "integer" }, monthName: { type: "string" }, invoiced: { type: "number" }, collected: { type: "number" }, outstanding: { type: "number" }, invoiceCount: { type: "integer" } } } } } } } } } },
        },
      },
    },
  },
  "/api/reports/customers/top": {
    get: {
      tags: ["Reports"],
      summary: "Top customers by invoice revenue",
      parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Max number of customers to return" }],
      responses: {
        200: {
          description: "Top customers ranked by total invoiced",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { customer: { $ref: "#/components/schemas/Customer" }, totalInvoiced: { type: "number" }, totalCollected: { type: "number" }, outstanding: { type: "number" }, invoiceCount: { type: "integer" } } } } } } } },
        },
      },
    },
  },
  "/api/reports/vendors/top": {
    get: {
      tags: ["Reports"],
      summary: "Top vendors by purchase order value",
      parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Max number of vendors to return" }],
      responses: {
        200: {
          description: "Top vendors ranked by total ordered",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { vendor: { $ref: "#/components/schemas/Vendor" }, totalOrdered: { type: "number" }, totalPaid: { type: "number" }, outstanding: { type: "number" }, poCount: { type: "integer" } } } } } } } },
        },
      },
    },
  },
  "/api/reports/stock": {
    get: {
      tags: ["Reports"],
      summary: "Stock report — current stock level for all items",
      responses: {
        200: {
          description: "List of items with current stock quantities",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { _id: { type: "string" }, name: { type: "string" }, make: { type: "string" }, hsnCode: { type: "string" }, stock: { type: "number" } } } } } } } },
        },
      },
    },
  },
  "/api/reports/pending": {
    get: {
      tags: ["Reports"],
      summary: "Pending report — Customer POs with pending delivery or invoice quantities",
      responses: {
        200: {
          description: "CPOs that still have items to deliver or invoice",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/CustomerPO" } } } } } },
        },
      },
    },
  },
  "/api/reports/dc-pending": {
    get: {
      tags: ["Reports"],
      summary: "DC pending invoice report — Delivery Notes not fully invoiced",
      description: "Returns all DCs where invoiceStatus is Pending or Partially Invoiced, with per-item deliveredQty, invoicedQty, and pendingInvoiceQty.",
      responses: {
        200: {
          description: "DCs with pending invoice items",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { _id: { type: "string" }, dnNumber: { type: "string" }, customer: { $ref: "#/components/schemas/Customer" }, cpoNumber: { type: "string", nullable: true }, deliveryDate: { type: "string" }, status: { type: "string" }, invoiceStatus: { type: "string", enum: ["Pending", "Partially Invoiced"] }, items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, deliveredQty: { type: "number" }, invoicedQty: { type: "number" }, pendingInvoiceQty: { type: "number" } } } } } } } } } } },
        },
      },
    },
  },
  "/api/reports/profit-loss": {
    get: {
      tags: ["Reports"],
      summary: "Profit & Loss report — monthly breakdown with expenses",
      description: "Returns full-year summary and month-by-month P&L. Includes revenue, cost of goods, gross profit, operational expenses (by category), net profit, GST collected, and cash flow.",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2026 }, description: "Calendar year (defaults to current year)" }],
      responses: {
        200: {
          description: "P&L report",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { year: { type: "integer" }, summary: { type: "object", properties: { revenue: { type: "number" }, costOfGoods: { type: "number" }, grossProfit: { type: "number" }, expenses: { type: "number" }, expenseBreakdown: { type: "object", properties: { Salary: { type: "number" }, Rent: { type: "number" }, Utilities: { type: "number" }, Transport: { type: "number" }, Maintenance: { type: "number" }, Other: { type: "number" } } }, netProfit: { type: "number" }, gstCollected: { type: "number" }, cashCollected: { type: "number" }, cashPaid: { type: "number" }, netCashflow: { type: "number" }, outstandingReceivable: { type: "number" }, outstandingPayable: { type: "number" } } }, monthly: { type: "array", items: { type: "object", properties: { month: { type: "integer" }, monthName: { type: "string" }, revenue: { type: "number" }, costOfGoods: { type: "number" }, grossProfit: { type: "number" }, expenses: { type: "number" }, expenseBreakdown: { type: "object" }, netProfit: { type: "number" }, gstCollected: { type: "number" }, netCashflow: { type: "number" } } } } } } } } } },
        },
      },
    },
  },

  "/api/reports/aging/debtors": {
    get: {
      tags: ["Reports"],
      summary: "Debtor aging report — outstanding invoices bucketed by days overdue",
      description: "Groups unpaid invoice balances per customer into buckets: Current (0-30 days), 31-60, 61-90, 90+. Sorted by total outstanding descending.",
      responses: {
        200: {
          description: "Aging report with per-customer breakdown",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { summary: { type: "object", properties: { current: { type: "number" }, "31-60": { type: "number" }, "61-90": { type: "number" }, "90+": { type: "number" }, totalOutstanding: { type: "number" } } }, customers: { type: "array", items: { type: "object", properties: { customer: { $ref: "#/components/schemas/Customer" }, current: { type: "number" }, "31-60": { type: "number" }, "61-90": { type: "number" }, "90+": { type: "number" }, totalOutstanding: { type: "number" }, invoices: { type: "array" } } } } } } } } } },
        },
      },
    },
  },
  "/api/reports/items/sales": {
    get: {
      tags: ["Reports"],
      summary: "Item sales report — items ranked by revenue and quantity sold",
      description: "Aggregates all invoice line items by product. Pass ?year= to filter by year.",
      parameters: [{ name: "year", in: "query", schema: { type: "integer", example: 2026 }, description: "Filter by calendar year (optional)" }],
      responses: {
        200: {
          description: "Items sorted by total revenue descending",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { itemId: { type: "string" }, name: { type: "string" }, make: { type: "string" }, hsnCode: { type: "string" }, totalQtySold: { type: "number" }, totalRevenue: { type: "number" }, totalTax: { type: "number" }, totalWithTax: { type: "number" }, invoiceCount: { type: "integer" } } } } } } } },
        },
      },
    },
  },
  "/api/reports/vendors/performance": {
    get: {
      tags: ["Reports"],
      summary: "Vendor performance report — fulfillment rate and avg delivery days",
      description: "For each vendor: total PO value, qty ordered vs received (fulfillment %), and average days from PO creation to first GRN.",
      responses: {
        200: {
          description: "Vendors sorted by total PO value descending",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { vendor: { $ref: "#/components/schemas/Vendor" }, poCount: { type: "integer" }, fullyReceivedCount: { type: "integer" }, totalPOValue: { type: "number" }, totalOrdered: { type: "number" }, totalReceived: { type: "number" }, fulfillmentRate: { type: "number", description: "% of ordered qty received" }, avgDeliveryDays: { type: "number", nullable: true, description: "Avg days from PO to first GRN. null if no GRNs yet." } } } } } } } },
        },
      },
    },
  },
  "/api/reports/customers/payment-behaviour": {
    get: {
      tags: ["Reports"],
      summary: "Customer payment behaviour — avg days to pay and reliability",
      description: "For each customer: total invoiced, paid, outstanding, payment rate (% invoices fully paid), and avg days taken to pay.",
      responses: {
        200: {
          description: "Customers sorted by total invoiced descending",
          content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { type: "object", properties: { customer: { $ref: "#/components/schemas/Customer" }, invoiceCount: { type: "integer" }, paidInvoiceCount: { type: "integer" }, totalInvoiced: { type: "number" }, totalPaid: { type: "number" }, totalOutstanding: { type: "number" }, paymentRate: { type: "number", description: "% of invoices fully paid" }, avgDaysToPay: { type: "number", nullable: true, description: "Avg days from invoice creation to full payment. null if no paid invoices." } } } } } } } },
        },
      },
    },
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  "/api/expenses": {
    get: {
      tags: ["Expenses"],
      summary: "List all expenses",
      description: "Filter by category using ?category=Salary",
      parameters: [{ name: "category", in: "query", schema: { type: "string", enum: ["Salary", "Rent", "Utilities", "Transport", "Maintenance", "Other"] }, description: "Filter by expense category" }],
      responses: {
        200: { description: "List of expenses", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Expense" } } } } } } },
      },
    },
    post: {
      tags: ["Expenses"],
      summary: "Record a new expense",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ExpenseInput" } } } },
      responses: {
        201: { description: "Expense recorded", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Expense" } } } } } },
        400: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },
  "/api/expenses/{id}": {
    get: {
      tags: ["Expenses"],
      summary: "Get expense by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Expense found", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Expense" } } } } } },
        404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
    put: {
      tags: ["Expenses"],
      summary: "Update an expense",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ExpenseInput" } } } },
      responses: {
        200: { description: "Expense updated" },
        404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
    delete: {
      tags: ["Expenses"],
      summary: "Delete an expense",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Expense deleted" },
        404: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      },
    },
  },

  // ── Investments (Admin only) ───────────────────────────────────────────────
  "/api/investments": {
    get: {
      tags: ["Investments"], summary: "List all investments",
      parameters: [{ name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }],
      responses: { 200: { description: "Paginated list of investments" } },
    },
    post: {
      tags: ["Investments"], summary: "Record a new investment",
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/InvestmentInput" } } } },
      responses: { 201: { description: "Investment created" }, 400: { description: "Validation error" } },
    },
  },
  "/api/investments/summary": {
    get: {
      tags: ["Investments"], summary: "Investment summary — totals by category and status",
      responses: { 200: { description: "{ totalInvested, byCategory, byStatus, count }" } },
    },
  },
  "/api/investments/{id}": {
    get: {
      tags: ["Investments"], summary: "Get investment by ID",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Investment found" }, 404: { description: "Not found" } },
    },
    put: {
      tags: ["Investments"], summary: "Update an investment",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/InvestmentInput" } } } },
      responses: { 200: { description: "Updated" }, 404: { description: "Not found" } },
    },
    delete: {
      tags: ["Investments"], summary: "Delete an investment",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Deleted" }, 404: { description: "Not found" } },
    },
  },

  // ── Exports ───────────────────────────────────────────────────────────────
  "/api/export/invoices": { get: { tags: ["Export"], summary: "Download all invoices as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/purchase-orders": { get: { tags: ["Export"], summary: "Download all purchase orders as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/delivery-notes": { get: { tags: ["Export"], summary: "Download all delivery notes as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/expenses": { get: { tags: ["Export"], summary: "Download expenses as Excel (?category=Salary to filter)", parameters: [{ name: "category", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Excel file download" } } } },
  "/api/export/stock": { get: { tags: ["Export"], summary: "Download current stock levels as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/debtors": { get: { tags: ["Export"], summary: "Download outstanding invoices (debtors) as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/investments": { get: { tags: ["Export"], summary: "Download investments as Excel (?category=Equipment to filter)", parameters: [{ name: "category", in: "query", schema: { type: "string" } }], responses: { 200: { description: "Excel file download" } } } },
  "/api/export/customer-pos": { get: { tags: ["Export"], summary: "Download all customer POs as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/quotations": { get: { tags: ["Export"], summary: "Download all quotations as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/grns": { get: { tags: ["Export"], summary: "Download all GRNs as Excel", responses: { 200: { description: "Excel file download" } } } },
  "/api/export/creditors": { get: { tags: ["Export"], summary: "Download outstanding creditors (POs) as Excel", responses: { 200: { description: "Excel file download" } } } },

  // ── Settings ─────────────────────────────────────────────────────────────
  "/api/settings": {
    get: {
      tags: ["Settings"],
      summary: "Get current business settings (opening balance)",
      responses: {
        200: {
          description: "Current settings",
          content: { "application/json": { schema: { type: "object", properties: {
            success: { type: "boolean" },
            data: { $ref: "#/components/schemas/Settings" },
          } } } },
        },
      },
    },
  },
  "/api/settings/opening-balance": {
    put: {
      tags: ["Settings"],
      summary: "Set opening cash balance (admin only)",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/OpeningBalanceInput" } } },
      },
      responses: {
        200: { description: "Opening balance updated" },
      },
    },
  },
};
