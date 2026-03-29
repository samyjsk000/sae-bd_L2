export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
};

export const parsePagination = (req) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  return { limit, offset };
};
