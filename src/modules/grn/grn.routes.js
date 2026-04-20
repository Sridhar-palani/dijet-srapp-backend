import express from "express";
import * as grnController from "./grn.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.post("/", grnController.createGRNController);
router.get("/", grnController.getAllGRNController);
router.get("/:id", validateObjectId, grnController.getGRNByIdController);
router.put("/:id", validateObjectId, grnController.updateGRNController);
router.delete("/:id", validateObjectId, grnController.deleteGRNController);

export default router;
