function parsePositiveInt(value, fallback = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function requirePositiveInt(value, message) {
  const parsed = parsePositiveInt(value);
  if (!parsed) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

module.exports = {
  parsePositiveInt,
  requirePositiveInt,
};
