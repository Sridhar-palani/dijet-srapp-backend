import express from "express";
import * as poController from "./purchase_order.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.post("/", poController.createPOController);
router.post("/from-cpo/:cpoId", validateObjectId, poController.createFromCPOController);
router.get("/", poController.getAllPOController);
router.get("/:id", validateObjectId, poController.getPOByIdController);
router.get("/:id/grns", validateObjectId, poController.getPOGRNsController);
router.put("/:id", validateObjectId, poController.updatePOController);
router.delete("/:id", validateObjectId, poController.deletePOController);

export default router;
