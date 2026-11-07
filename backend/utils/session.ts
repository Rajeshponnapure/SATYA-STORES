import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { getDatabase } from "../db/database";

const ADMIN_COOKIE = "satya_admin_session";
const CUSTOMER_COOKIE = "satya_customer_session";
const ADMIN_SESSION_SECONDS = 2 * 60 * 60;
const CUSTOMER_SESSION_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  return value && value.length >= 16 ? value : "satya_stores_default_secure_session_secret_2026_production_key";
}

function signature(value: string, key: string): string {
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function makeCookie(res: Response, name: string, value: string, maxAge: number): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append("Set-Cookie", `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
}

function clearCookie(res: Response, name: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append("Set-Cookie", `${name}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
}

function readCookie(req: Request, name: string): string | undefined {
  return req.headers.cookie?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function readSession(req: Request, name: string): string | null {
  const key = secret();
  const token = readCookie(req, name);
  if (!key || !token) return null;
  const [subject, expiryText, receivedText, extra] = token.split(".");
  if (!subject || !/^\d+$/.test(expiryText || "") || extra !== undefined || Number(expiryText) <= Date.now()) return null;
  if (!/^[a-f0-9]{64}$/i.test(receivedText || "")) return null;
  const expected = Buffer.from(signature(`${subject}.${expiryText}`, key), "hex");
  const received = Buffer.from(receivedText, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected) ? subject : null;
}

function issue(res: Response, name: string, subject: string, durationSeconds: number): boolean {
  const key = secret();
  if (!key) return false;
  const expiry = String(Date.now() + durationSeconds * 1000);
  makeCookie(res, name, `${subject}.${expiry}.${signature(`${subject}.${expiry}`, key)}`, durationSeconds);
  return true;
}

export const setAdminSession = (res: Response): boolean => issue(res, ADMIN_COOKIE, "owner", ADMIN_SESSION_SECONDS);
export const setCustomerSession = (res: Response, userId: string): boolean => issue(res, CUSTOMER_COOKIE, userId, CUSTOMER_SESSION_SECONDS);
export const clearAdminSession = (res: Response): void => clearCookie(res, ADMIN_COOKIE);
export const clearCustomerSession = (res: Response): void => clearCookie(res, CUSTOMER_COOKIE);
export const getCustomerSessionId = (req: Request): string | null => readSession(req, CUSTOMER_COOKIE);
export const hasAdminSession = (req: Request): boolean => readSession(req, ADMIN_COOKIE) === "owner";

export function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "POST" && req.path === "/logout") return next();
  if (hasAdminSession(req)) return next();
  res.status(process.env.NODE_ENV === "production" && !secret() ? 503 : 401).json({
    success: false,
    error: process.env.NODE_ENV === "production" && !secret()
      ? "A strong session secret (at least 32 characters) is required."
      : "Administrative sign-in required.",
  });
}

export async function requireCustomerSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = getCustomerSessionId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: "Customer sign-in required." });
    return;
  }
  try {
    const db = await getDatabase();
    const user = db.users.find((record) => record.id === userId);
    if (!user || user.role !== "customer" || user.accountStatus !== "active") {
      clearCustomerSession(res);
      res.status(401).json({ success: false, error: "Customer session is no longer valid." });
      return;
    }
  } catch {
    res.status(503).json({ success: false, error: "Account service is temporarily unavailable." });
    return;
  }
  const requestedId = req.params.id;
  if (requestedId && requestedId !== userId && !hasAdminSession(req)) {
    res.status(403).json({ success: false, error: "You may only access your own account." });
    return;
  }
  res.locals.customerId = userId;
  next();
}
