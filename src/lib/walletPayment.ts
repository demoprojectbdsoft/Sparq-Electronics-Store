import type { PaymentMethod } from "@/types";

/**
 * Demo helpers for the mobile wallet step at checkout.
 *
 * A real gateway sends the customer to bKash / Nagad / Rocket and then calls an
 * API to confirm the TrxID. This site is a demo, so the functions below only
 * build realistic looking values - there is no network call and no real money.
 */

// Letters and digits only, with look-alike characters (I, O, 0, 1) removed.
const TRX_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const TRX_DIGITS = "23456789";

function randomString(alphabet: string, length: number): string {
  let text = "";
  for (let index = 0; index < length; index += 1) {
    text += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return text;
}

/** A believable 11-digit Bangladeshi number, e.g. 01712345678. */
export function buildDemoWalletPhone(): string {
  const operators = ["3", "5", "7", "8", "9"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  return `01${operator}${randomString("0123456789", 8)}`;
}

/** bKash and Nagad show a 10-character code, Rocket (DBBL) uses 12 digits. */
export function buildDemoTransactionId(method: PaymentMethod): string {
  if (method === "rocket") return randomString("0123456789", 12);
  return randomString(TRX_LETTERS + TRX_DIGITS, 10);
}

/** Keep digits only, drop a +880 / 880 country code, stop at 11 characters. */
export function normaliseWalletPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("880")) digits = digits.slice(3);
  // "+880 1712 345678" arrives as 1712345678 - put the local 0 back.
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  return digits.slice(0, 11);
}

/** Bangladeshi numbers start with 01, then an operator digit (3-9). */
export function isWalletPhoneValid(value: string): boolean {
  return /^01[3-9]\d{8}$/.test(value);
}

/** Upper case, no spaces or dashes - the format shown in the wallet SMS. */
export function normaliseTransactionId(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase().slice(0, 20);
}

/** Wallets print 8 to 20 letters and digits, so that is what we accept. */
export function isTransactionIdValid(value: string): boolean {
  return /^[A-Z0-9]{8,20}$/.test(value);
}
