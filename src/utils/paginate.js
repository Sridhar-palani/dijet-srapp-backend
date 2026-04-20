export const paginate = async (baseQuery, countQuery, { page = 1, limit = 20 } = {}) => {
  const l = Math.min(1000, Math.max(1, parseInt(limit) || 20));
  const p = Math.max(1, parseInt(page) || 1);
  const skip = (p - 1) * l;
  const [data, total] = await Promise.all([
    baseQuery.skip(skip).limit(l),
    countQuery,
  ]);
  return { data, total, page: p, totalPages: Math.ceil(total / l) };
};
