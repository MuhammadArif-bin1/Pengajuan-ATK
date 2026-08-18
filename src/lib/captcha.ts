import crypto from "crypto";

const CAPTCHA_SECRET = process.env.JWT_SECRET || "hasamitra-audit-captcha-secret-2026";
const CAPTCHA_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface CaptchaData {
  token: string;
  question: string;
}

/**
 * Generate a randomized math captcha challenge
 */
export function generateMathCaptcha(): CaptchaData {
  const operators = ["+", "-", "x"];
  const op = operators[Math.floor(Math.random() * operators.length)];

  let num1 = 0;
  let num2 = 0;
  let answer = 0;

  if (op === "+") {
    num1 = Math.floor(Math.random() * 30) + 5;
    num2 = Math.floor(Math.random() * 20) + 1;
    answer = num1 + num2;
  } else if (op === "-") {
    num1 = Math.floor(Math.random() * 30) + 15;
    num2 = Math.floor(Math.random() * 14) + 1;
    answer = num1 - num2;
  } else {
    // Multiplication (single digits to keep it friendly yet secure)
    num1 = Math.floor(Math.random() * 9) + 2;
    num2 = Math.floor(Math.random() * 8) + 2;
    answer = num1 * num2;
  }

  const question = `${num1} ${op} ${num2} = ?`;
  const expiresAt = Date.now() + CAPTCHA_EXPIRY_MS;

  const payload = `${answer}:${expiresAt}:${Math.random().toString(36).substring(2, 8)}`;
  const signature = crypto
    .createHmac("sha256", CAPTCHA_SECRET)
    .update(payload)
    .digest("hex");

  const token = Buffer.from(`${payload}:${signature}`).toString("base64url");

  return {
    token,
    question,
  };
}

/**
 * Verify math captcha response
 */
export function verifyMathCaptcha(token: string, userAnswer: string | number): { valid: boolean; reason?: string } {
  try {
    if (!token || userAnswer === undefined || userAnswer === null || String(userAnswer).trim() === "") {
      return { valid: false, reason: "Jawaban captcha matematika wajib diisi" };
    }

    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) {
      return { valid: false, reason: "Token captcha tidak valid" };
    }

    const [expectedAnswerStr, expiresAtStr, salt, signature] = parts;
    const payload = `${expectedAnswerStr}:${expiresAtStr}:${salt}`;
    const expectedSig = crypto
      .createHmac("sha256", CAPTCHA_SECRET)
      .update(payload)
      .digest("hex");

    if (expectedSig !== signature) {
      return { valid: false, reason: "Keamanan captcha gagal diverifikasi" };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() > expiresAt) {
      return { valid: false, reason: "Captcha sudah kedaluwarsa. Silakan refresh captcha baru." };
    }

    const parsedUserAnswer = parseInt(String(userAnswer).trim(), 10);
    const expectedAnswer = parseInt(expectedAnswerStr, 10);

    if (isNaN(parsedUserAnswer) || parsedUserAnswer !== expectedAnswer) {
      return { valid: false, reason: "Jawaban perhitungan matematika salah. Silakan coba lagi." };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: "Terjadi kesalahan saat memvalidasi captcha" };
  }
}
