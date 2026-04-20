import express from "express";
import upload from "../../config/multer.js";
import * as itemController from "./item.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/types", itemController.getItemTypesController);
router.get("/", itemController.getAllItemsController);
router.patch("/:id/approve", validateObjectId, adminOnly, itemController.approveItemController);
router.patch("/:id/reject", validateObjectId, adminOnly, itemController.rejectItemController);
router.get("/:id", validateObjectId, itemController.getItemByIdController);
router.post("/", upload.single("image"), itemController.createItemController);
router.put("/:id", validateObjectId, adminOnly, upload.single("image"), itemController.updateItemController);
router.delete("/:id", validateObjectId, adminOnly, itemController.deleteItemController);

export default router;
