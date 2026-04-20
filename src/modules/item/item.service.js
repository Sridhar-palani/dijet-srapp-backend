import Item, { ITEM_TYPE_HSN_MAP } from "./item.model.js";
import PurchaseOrder from "../purchase_order/purchase_order.model.js";
import { uploadToCloudinary, updateCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/paginate.js";

export const createItem = async (req) => {
  const { name, make, hsnCode, application, itemType, listPrice, maxDiscountPercent, note } = req.body;
  if (!name || !make) {
    throw new AppError("Please provide all required fields: name, make", 400);
  }
  if (!req.file) {
    throw new AppError("Please upload an image for the item", 400);
  }
  const upload = await uploadToCloudinary(req.file);

  // Auto-fill HSN from itemType if hsnCode not explicitly provided
  const resolvedHsn = hsnCode || (itemType ? ITEM_TYPE_HSN_MAP[itemType] : undefined);

  const status = req.user?.role === "admin" ? "active" : "pending_approval";

  const newItem = new Item({
    name,
    image: upload.secure_url,
    make,
    itemType,
    hsnCode: resolvedHsn,
    public_id: upload.public_id,
    application,
    listPrice: listPrice || 0,
    maxDiscountPercent: maxDiscountPercent ?? 100,
    note,
    status,
  });
  return await newItem.save();
};
export const getAllItems = async ({ page, limit, all, search } = {}) => {
  const filter = all === true || all === "true" ? {} : { status: "active" };
  if (search) {
    const regex = { $regex: search, $options: "i" };
    filter.$or = [{ name: regex }, { make: regex }, { application: regex }];
  }
  const result = await paginate(Item.find(filter), Item.countDocuments(filter), { page, limit });

  // Compute pendingStock only for items on this page via targeted aggregation
  const itemIds = result.data.map((item) => item._id);
  const pendingAgg = await PurchaseOrder.aggregate([
    { $match: { status: { $in: ["Open", "Partially Received"] } } },
    { $unwind: "$items" },
    { $match: { "items.itemId": { $in: itemIds } } },
    {
      $group: {
        _id: "$items.itemId",
        pendingStock: {
          $sum: { $max: [0, { $subtract: ["$items.quantity", { $ifNull: ["$items.receivedQty", 0] }] }] },
        },
      },
    },
  ]);
  const pendingMap = {};
  for (const doc of pendingAgg) {
    pendingMap[doc._id.toString()] = doc.pendingStock;
  }

  result.data = result.data.map((item) => {
    const obj = item.toObject ? item.toObject() : item;
    obj.pendingStock = pendingMap[obj._id.toString()] || 0;
    return obj;
  });

  return result;
};

export const getItemById = async (id) => {
  return await Item.findById(id);
};

export const updateItem = async (req, id) => {
  const item = await Item.findById(id);
  if (!item) {
    throw new AppError("Item not found", 404);
  }
  const data = { ...req.body };
  if (req.file) {
    // Delete old image from Cloudinary first (if it exists), then upload fresh.
    // Overwrite-in-place is avoided because Cloudinary CDN caches the old URL
    // and won't serve the new image until the cache expires.
    if (item.public_id) {
      await deleteFromCloudinary(item.public_id, "image");
    }
    const upload = await uploadToCloudinary(req.file);
    data.image = upload.secure_url;
    data.public_id = upload.public_id;
  }
  // Auto-fill HSN from itemType if itemType changed and hsnCode not explicitly provided
  if (data.itemType && !data.hsnCode) {
    const mapped = ITEM_TYPE_HSN_MAP[data.itemType];
    if (mapped) data.hsnCode = mapped;
  }
  return await Item.findByIdAndUpdate(id, data, { new: true });
};

export const deleteItem = async (id) => {
  const item = await Item.findById(id);
  if (!item) {
    throw new AppError("Item not found", 404);
  }
  await deleteFromCloudinary(item.public_id, "image");
  return await Item.findByIdAndDelete(id);
};

export const approveItem = async (id) => {
  const item = await Item.findById(id);
  if (!item) throw new AppError("Item not found", 404);
  if (item.status === "active") throw new AppError("Item is already active", 400);
  return await Item.findByIdAndUpdate(id, { status: "active" }, { new: true });
};

export const rejectItem = async (id) => {
  const item = await Item.findById(id);
  if (!item) throw new AppError("Item not found", 404);
  await deleteFromCloudinary(item.public_id, "image");
  return await Item.findByIdAndDelete(id);
};
