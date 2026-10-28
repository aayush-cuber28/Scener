const { validateNickname, isValidEmail } = require("../src/utils/validators");

describe("validateNickname()", () => {
  test("accepts a normal valid nickname", () => {
    expect(validateNickname("Aayush_99")).toBe(true);
  });

  test("rejects nicknames shorter than 3 characters", () => {
    expect(validateNickname("ab")).toBe(false);
  });

  test("rejects nicknames longer than 15 characters", () => {
    expect(validateNickname("thisNicknameIsWayTooLong")).toBe(false);
  });

  test("rejects nicknames with spaces", () => {
    expect(validateNickname("aayush yadav")).toBe(false);
  });

  test("rejects nicknames with special characters", () => {
    expect(validateNickname("aayush@123")).toBe(false);
  });

  test("rejects empty or missing input", () => {
    expect(validateNickname("")).toBe(false);
    expect(validateNickname(undefined)).toBe(false);
  });
});

describe("isValidEmail()", () => {
  test("accepts a normal valid email", () => {
    expect(isValidEmail("aayush@example.com")).toBe(true);
  });

  test("rejects an email missing the @ symbol", () => {
    expect(isValidEmail("aayushexample.com")).toBe(false);
  });

  test("rejects an email missing a domain", () => {
    expect(isValidEmail("aayush@")).toBe(false);
  });

  test("rejects empty or missing input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});
