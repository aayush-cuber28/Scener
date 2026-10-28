const BAD_WORDS = [
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bitch", "bitches", "nigga","ching chong","aalha hu akbar", "9/11",

  "asshole", "bastard", "dick", "cunt", "slut", "whore", "idiot", "moron",
  "madarchod", "bhenchod", "chutiya", "gandu", "harami", "tua ka tatta", "bakri ki jhat ka keedha", "machaar ki tatti",
  "kutte ka moot", "chamkadar ki tatti ka keedha", "peshab ki dhar ki akhri boond", "santa ke nipple ke baal",
  "kinnar ki aulad", "phate condom ki aulad", "kutte ki lendi", "suuar ka latke hue tatte",
];

// Turns look-alike characters into letters ("$h1t" -> "shit") and squeezes spaces.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Squeezes spaces only, so entries with digits or symbols ("9/11") can be matched as typed.
function squeeze(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

// True if `phrase` appears in `text` as whole word(s), e.g. "dick" matches "a dick" but not "dickens".
function hasPhrase(text, phrase) {
  return ` ${text} `.includes(` ${phrase} `);
}

function containsProfanity(text) {
  if (typeof text !== "string") return false;
  const clean = normalize(text);
  const raw = squeeze(text.replace(/[.,!?;:"'()]/g, " "));
  return BAD_WORDS.some((entry) =>
    /^[a-z\s]+$/.test(entry) ? hasPhrase(clean, normalize(entry)) : hasPhrase(raw, squeeze(entry))
  );
}

module.exports = { containsProfanity };
