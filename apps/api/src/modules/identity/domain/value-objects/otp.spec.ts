import { generateOtpCode, OTP_LENGTH } from "./otp";

describe("generateOtpCode", () => {
  it("produces a code of exactly OTP_LENGTH digits", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOtpCode();
      expect(code).toHaveLength(OTP_LENGTH);
      expect(code).toMatch(/^\d+$/);
    }
  });

  it("zero-pads codes shorter than OTP_LENGTH digits", () => {
    // randomInt(0, 10**6) can legitimately produce small numbers like 42 — the code must
    // still come out as "000042", not "42", or downstream Length(6,6) validation would
    // reject a perfectly valid code purely because it happened to start with zeros.
    const codes = Array.from({ length: 500 }, () => generateOtpCode());
    expect(codes.every((c) => c.length === OTP_LENGTH)).toBe(true);
  });

  it("is not hardcoded to a single value", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateOtpCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
