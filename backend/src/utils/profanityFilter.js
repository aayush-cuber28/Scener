const BAD_WORDS = [
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bitch", "bitches",
  "asshole", "bastard", "dick", "cunt", "slut", "whore", "idiot", "moron",
  "madarchod", "bhenchod", "chutiya", "gandu", "harami",
];

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z\s]/g, " ");
}

function containsProfanity(text) {
  if (typeof text !== "string") return false;
  const words = normalize(text).split(/\s+/);
  return words.some((word) => BAD_WORDS.includes(word));
}

module.exports = { containsProfanity };