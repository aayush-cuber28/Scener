const { calculateRating } = require("../src/utils/ratingCalculator");

describe("calculateRating()", () => {
  test("returns the owner score when there are no user votes", () => {
    expect(calculateRating(8, [])).toBe(8);
  });

  test("correctly blends owner score with user votes", () => {
    // owner=9 (weight 3), votes=[6,6] -> (9*3 + 6+6)/(3+2) = 39/5 = 7.8
    expect(calculateRating(9, [6, 6])).toBe(7.8);
  });

  test("ignores invalid votes (out of range or wrong type)", () => {
    expect(calculateRating(8, [7, 999, "bad", -5])).toBe(
      calculateRating(8, [7])
    );
  });

  test("throws an error for an invalid owner score", () => {
    expect(() => calculateRating(15, [5])).toThrow();
    expect(() => calculateRating(-1, [5])).toThrow();
  });

  test("throws an error if userVotes is not an array", () => {
    expect(() => calculateRating(8, "not-an-array")).toThrow();
  });

  test("handles an empty owner-only rating of 0", () => {
    expect(calculateRating(0, [])).toBe(0);
  });
});
