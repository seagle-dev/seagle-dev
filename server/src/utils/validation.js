/**
 * Validates an email address.
 * @param {string} email
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password.
 * Must be at least 8 characters long.
 * Must contain at least one uppercase letter.
 * Must contain at least one lowercase letter.
 * Must contain at least one number.
 * @param {string} password
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidPassword(password) {
  if (!password) return false;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

module.exports = {
  isValidEmail,
  isValidPassword
};
