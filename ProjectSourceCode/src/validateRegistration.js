const EMAIL_FORMAT = /^[A-Za-z0-9._%+]+@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/;

function validateRegistration(input) {
  return Boolean(
    input &&
      typeof input.username === 'string' &&
      input.username.trim().length > 0 &&
      input.username.trim().length <= 32 &&
      typeof input.email === 'string' &&
      EMAIL_FORMAT.test(input.email.trim()) &&
      typeof input.password === 'string' &&
      input.password.length >= 8
  );
}

module.exports = validateRegistration;