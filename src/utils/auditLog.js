import AuditLog from "../modules/audit/audit.model.js";
import logger from "./logger.js";

/**
 * Log an audit event. Fire-and-forget — never throws.
 * @param {object} req  - Express request (needs req.user, req.ip)
 * @param {string} action - "CREATE" | "UPDATE" | "DELETE"
 * @param {string} module - e.g. "Invoice"
 * @param {string|object} documentId - MongoDB _id of the affected document
 * @param {string} description - Human-readable summary
 * @param {string} [documentRef] - Optional human-readable ref (invoice number, etc.)
 */
export const logAudit = (req, action, module, documentId, description, documentRef) => {
  if (!req?.user) return;
  AuditLog.create({
    userId: req.user._id,
    userName: req.user.name,
    action,
    module,
    documentId,
    documentRef,
    description,
    ipAddress: req.ip || req.headers["x-forwarded-for"],
  }).catch((err) => logger.error(`Audit log failed: ${err.message}`));
};
