function success(res, data, statusCode = 200, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(Object.keys(meta).length ? { meta } : {}),
  });
}

function error(res, message, statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function paginated(res, data, { page, limit, total }) {
  return success(res, data, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = { success, error, paginated };
