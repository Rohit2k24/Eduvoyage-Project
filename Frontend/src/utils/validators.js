export const validatePassport = (passport) => {
  const errors = {};
  if (!/^[A-Z][0-9]{7}$/.test(passport.number)) {
    errors.number = 'Invalid passport format (A1234567)';
  }
  if (!passport.expiryDate || new Date(passport.expiryDate) < new Date()) {
    errors.expiryDate = 'Expiry date must be in the future';
  }
  return errors;
}; 