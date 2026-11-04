import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "satya_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;
const DEVELOPMENT_SECRET = crypto.randomBytes(32).toString("hex");

function getSecret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  return process.env.NODE_ENV === "production" ? null : DEVELOPMENT_SECRET;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function setAdminSession(res: Response): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const payload = `${Date.now() + SESSION_SECONDS * 1000}`;
  const token = `${payload}.${sign(payload, secret)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_SECONDS}${secure}`
  );
  return true;
}

export function clearAdminSession(res: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${secure}`);
}

function hasValidSession(req: Request): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!cookie) return false;
  const [expiresAt, signature, extra] = cookie.split(".");
  if (!expiresAt || !signature || extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) {
    return false;
  }
  const expected = Buffer.from(sign(expiresAt, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "POST" && req.path === "/logout") {
    next();
    return;
  }
  if (hasValidSession(req)) {
    next();
    return;
  }
  res.status(process.env.NODE_ENV === "production" && !process.env.ADMIN_SESSION_SECRET ? 503 : 401).json({
    success: false,
    error: process.env.NODE_ENV === "production" && !process.env.ADMIN_SESSION_SECRET
      ? "Admin session signing is not configured."
      : "Administrative sign-in required.",
  });
}
