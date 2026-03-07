import type { NextResponse } from "next/server";

import type { SessionPayload, UserSummary } from "@/lib/auth/types";

export const SESSION_COOKIE_NAME = "shop_inventory_session";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return secret;
}

function bytesToBase64Url(bytes: Uint8Array) {
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(bytes).toString("base64")
      : btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function safeCompare(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a[index] ^ b[index];
  }

  return mismatch === 0;
}

async function signValue(value: string) {
  const secret = getSessionSecret();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(user: UserSummary) {
  const issuedAt = Date.now();
  const payload: SessionPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    iat: issuedAt,
    exp: issuedAt + SESSION_DURATION_MS,
    version: 1,
  };

  const encodedPayload = bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(encodedPayload);

  if (!safeCompare(base64UrlToBytes(signature), base64UrlToBytes(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(textDecoder.decode(base64UrlToBytes(encodedPayload))) as SessionPayload;

    if (
      payload.version !== 1 ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.iat !== "number" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
