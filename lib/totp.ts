import * as OTPAuth from "otpauth";

// OTP Config matching PRD (20 seconds TTL, 4 options)
const OTP_PERIOD = 20;
const OTP_DIGITS = 4;

export function generateTOTP(secret: string) {
  let totp = new OTPAuth.TOTP({
    issuer: "Hadarni",
    label: "Attendance",
    algorithm: "SHA1",
    digits: OTP_DIGITS,
    period: OTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  return totp.generate();
}

export function generateFakeOTPs(correctOTP: string, count: number = 3) {
  const fakes = new Set<string>();
  while (fakes.size < count) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(OTP_DIGITS, '0');
    if (random !== correctOTP) {
      fakes.add(random);
    }
  }
  return Array.from(fakes);
}

export function validateTOTP(secret: string, token: string) {
  let totp = new OTPAuth.TOTP({
    issuer: "Hadarni",
    label: "Attendance",
    algorithm: "SHA1",
    digits: OTP_DIGITS,
    period: OTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  let delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function generateSecret() {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}
