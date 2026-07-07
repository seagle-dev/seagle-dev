const { isValidEmail, isValidPassword } = require('./validation');

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@no-local-part.com')).toBe(false);
      expect(isValidEmail('no-at-sign.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false); // simplistic domain check
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('StrongPass1!')).toBe(true);
      expect(isValidPassword('Valid1Pass')).toBe(true);
    });

    it('should return false for passwords that are too short', () => {
      expect(isValidPassword('Short1!')).toBe(false); // 7 chars
    });

    it('should return false for passwords without uppercase letters', () => {
      expect(isValidPassword('weakpass1!')).toBe(false);
    });

    it('should return false for passwords without lowercase letters', () => {
      expect(isValidPassword('WEAKPASS1!')).toBe(false);
    });

    it('should return false for passwords without numbers', () => {
      expect(isValidPassword('WeakPassword!')).toBe(false);
    });

    it('should return false for empty or null passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });
});
