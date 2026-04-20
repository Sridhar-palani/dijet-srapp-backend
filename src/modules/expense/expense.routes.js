import express from "express";
import * as expenseController from "./expense.controller.js";
import validateObjectId from "../../middlewares/validateObjectId.js";
import { adminOnly } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(adminOnly);

router.post("/", expenseController.createExpenseController);
router.get("/", expenseController.getAllExpensesController);
router.get("/:id", validateObjectId, expenseController.getExpenseByIdController);
router.put("/:id", validateObjectId, expenseController.updateExpenseController);
router.delete("/:id", validateObjectId, expenseController.deleteExpenseController);

export default router;
