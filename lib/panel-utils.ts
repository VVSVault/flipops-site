import crypto from "crypto";

export function toPct(num: number): number {
  return Math.round(num * 10000) / 100;
}

export function safePct(n: number, d: number): number {
  if (d <= 0) return 0;
  return n / d;
}

export function etagFor(obj: any): string {
  const s = JSON.stringify(obj);
  return crypto.createHash("sha1").update(s).digest("hex");
}