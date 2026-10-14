function validateNickname(nickname) {
  if (typeof nickname !== "string") return false;
  const trimmed = nickname.trim();
  if (trimmed.length < 3 || trimmed.length > 15) return false;
  return /^[a-zA-Z0-9_]+$/.test(trimmed);
}

function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = { validateNickname, isValidEmail };