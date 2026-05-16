import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role, UserStatus } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/services/access-control";

const COOKIE_NAME = "cistodom_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  status: UserStatus;
};

type SessionPayload = {
  userId: string;
  exp: number;
};

function secret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-before-production";
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function verifySignature(value: string, signature: string) {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function encodeSession(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function decodeSession(cookieValue?: string): SessionPayload | null {
  if (!cookieValue) return null;
  const [body, signature] = cookieValue.split(".");
  if (!body || !signature || !verifySignature(body, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const value = encodeSession({
    userId,
    exp: expires.getTime()
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/"
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const payload = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true
    }
  });

  if (!user || user.status !== "ACTIVE") return null;
  return user as SessionUser;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) redirect(dashboardPathForRole(user.role));
  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();
  if (user) redirect(dashboardPathForRole(user.role));
}
