const { GENRES, isValidCategory, cleanGenres } = require("../src/utils/genres");

describe("genres", () => {
  test("movies, songs and series each have their own genre list", () => {
    expect(GENRES.movie).toContain("Action");
    expect(GENRES.song).toContain("Pop");
    expect(GENRES.series).toContain("Anime");
    expect(GENRES.song).not.toContain("Action");
  });

  test("isValidCategory accepts only movie, song and series", () => {
    expect(isValidCategory("movie")).toBe(true);
    expect(isValidCategory("series")).toBe(true);
    expect(isValidCategory("book")).toBe(false);
    expect(isValidCategory(undefined)).toBe(false);
  });

  test("cleanGenres accepts a comma-separated string", () => {
    expect(cleanGenres("movie", "Action, Drama")).toEqual(["Action", "Drama"]);
  });

  test("cleanGenres accepts an array and removes duplicates", () => {
    expect(cleanGenres("song", ["Pop", "Pop", "Rock"])).toEqual(["Pop", "Rock"]);
  });

  test("cleanGenres returns an empty list when nothing is picked", () => {
    expect(cleanGenres("movie", "")).toEqual([]);
    expect(cleanGenres("movie", undefined)).toEqual([]);
  });

  test("cleanGenres rejects a genre from another category", () => {
    expect(cleanGenres("song", "Action")).toBeNull();
    expect(cleanGenres("movie", ["Drama", "Made-up"])).toBeNull();
  });
});
