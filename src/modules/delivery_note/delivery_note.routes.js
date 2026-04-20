import express from "express";
import * as dnController from "./delivery_note.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";

const router = express.Router();

router.post("/", dnController.createDNController);
router.post("/from-cpo/:cpoId", validateObjectId, dnController.createFromCPOController);
router.get("/", dnController.getAllDNController);
router.get("/:id", validateObjectId, dnController.getDNByIdController);
router.put("/:id", validateObjectId, dnController.updateDNController);
router.delete("/:id", validateObjectId, dnController.deleteDNController);

export default router;
