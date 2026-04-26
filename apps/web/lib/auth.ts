// Tiny self-contained password hashing using Node's built-in crypto (scrypt).
// Format: scrypt$<salt-hex>$<hash-hex>
import crypto from "node:crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const got = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

export function parseSession(value: string | undefined | null): {
  email: string;
  issuedAt: number;
} | null {
  if (!value) return null;
  const idx = value.lastIndexOf(":");
  if (idx <= 0) return null;
  try {
    return {
      email: decodeURIComponent(value.slice(0, idx)),
      issuedAt: Number(value.slice(idx + 1)) || 0,
    };
  } catch {
    return null;
  }
}
