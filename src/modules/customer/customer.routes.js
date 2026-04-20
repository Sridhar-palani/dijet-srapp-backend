import express from "express";
import * as customerController from "./customer.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", customerController.createCustomerController);
router.get("/", customerController.getAllCustomersController);
router.get("/:id", validateObjectId, customerController.getCustomerByIdController);
router.put("/:id", validateObjectId, customerController.updateCustomerController);
router.delete("/:id", validateObjectId, adminOnly, customerController.deleteCustomerController);

export default router;
