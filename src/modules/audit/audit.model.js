import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName:     { type: String, required: true },
    action:       { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true },
    module:       { type: String, required: true }, // e.g. "Invoice", "CustomerPO"
    documentId:   { type: mongoose.Schema.Types.ObjectId },
    documentRef:  { type: String }, // human-readable ref, e.g. "RE/001/25-26"
    description:  { type: String }, // e.g. "Created invoice RE/001/25-26 for Gayath Industries"
    ipAddress:    { type: String },
  },
  { timestamps: true }
);

// Index for fast filtering by module, user, or date
auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
