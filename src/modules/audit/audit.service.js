import AuditLog from "./audit.model.js";
import { paginate } from "../../utils/paginate.js";

export const getAuditLogs = async ({ page, limit, module, userId, action } = {}) => {
  const filter = {};
  if (module) filter.module = module;
  if (userId) filter.userId = userId;
  if (action) filter.action = action;

  return paginate(
    AuditLog.find(filter).populate("userId", "name email").sort({ createdAt: -1 }),
    AuditLog.countDocuments(filter),
    { page, limit }
  );
};
