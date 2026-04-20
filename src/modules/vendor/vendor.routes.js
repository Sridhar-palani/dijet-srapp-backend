import express from "express";
import * as vendorController from "./vendor.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.post("/", vendorController.createVendorController);
router.get("/", vendorController.getAllVendorsController);
router.get("/:id", validateObjectId, vendorController.getVendorByIdController);
router.put("/:id", validateObjectId, vendorController.updateVendorController);
router.delete("/:id", validateObjectId, vendorController.deleteVendorController);

export default router;
