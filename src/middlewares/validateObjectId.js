import mongoose from "mongoose";

const validateObjectId = (req, res, next) => {
  const id =
    req.params.id ||
    req.params.quotationId ||
    req.params.cpoId ||
    req.params.grnId ||
    req.params.invoiceId ||
    req.params.poId;

  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  next();
};

export default validateObjectId;
