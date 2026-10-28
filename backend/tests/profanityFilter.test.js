const { containsProfanity } = require("../src/utils/profanityFilter");

describe("containsProfanity()", () => {
  test("allows a normal, respectful comment", () => {
    expect(containsProfanity("Loved the soundtrack, the ending was brilliant!")).toBe(false);
  });

  test("blocks a single bad word", () => {
    expect(containsProfanity("this movie is shit")).toBe(true);
  });

  test("blocks bad words regardless of upper/lower case", () => {
    expect(containsProfanity("What an IDIOT")).toBe(true);
  });

  test("blocks look-alike spellings ($h1t)", () => {
    expect(containsProfanity("total $h1t")).toBe(true);
  });

  test("blocks multi-word phrases", () => {
    expect(containsProfanity("you kutte ki lendi")).toBe(true);
  });

  test("blocks entries with numbers or symbols as typed", () => {
    expect(containsProfanity("jokes about 9/11 are not ok")).toBe(true);
  });

  test("does not block clean words that contain a bad word inside them", () => {
    expect(containsProfanity("Charles Dickens wrote great stories")).toBe(false);
    expect(containsProfanity("Part II was better than Part I")).toBe(false);
  });

  test("returns false for non-string input", () => {
    expect(containsProfanity(undefined)).toBe(false);
    expect(containsProfanity(42)).toBe(false);
  });
});
