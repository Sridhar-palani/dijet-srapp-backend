/**
 * Resolves the CPO status based on current item delivery/invoice quantities.
 * Pure function — no DB calls. Use after mutating CPO item quantities.
 *
 * Status progression:
 *   Confirmed → Partially Delivered → Delivered → Partially Invoiced → Invoiced → Closed
 *
 * Rules:
 * - Closed is terminal; this function never changes it.
 * - Once all delivered qty is invoiced → Closed
 * - Once any invoiced → Partially Invoiced
 * - Once all ordered qty is delivered → Delivered
 * - Once any delivered → Partially Delivered
 * - Otherwise keep current status (e.g. Confirmed)
 */
const resolveCPOStatus = (items, currentStatus) => {
  if (currentStatus === "Closed") return "Closed";
  if (!items || items.length === 0) return currentStatus;

  const anyDelivered = items.some((i) => (i.deliveredQty || 0) > 0);
  const allDelivered = items.every((i) => (i.deliveredQty || 0) >= i.orderedQty);
  const anyInvoiced = items.some((i) => (i.invoicedQty || 0) > 0);
  const allInvoiced =
    allDelivered &&
    items.every((i) => (i.invoicedQty || 0) >= (i.deliveredQty || 0));

  if (allInvoiced && anyInvoiced) return "Closed";
  if (anyInvoiced) return "Partially Invoiced";
  if (allDelivered) return "Delivered";
  if (anyDelivered) return "Partially Delivered";
  // Nothing delivered or invoiced — revert to initial state
  return "Confirmed";
};

export default resolveCPOStatus;
