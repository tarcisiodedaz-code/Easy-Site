import { cookies } from "next/headers";

const COOKIE_NAME = "easy_games_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function isAdminLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === (await getAdminToken());
}

async function getAdminToken(): Promise<string> {
  return Buffer.from(ADMIN_PASSWORD + ":" + (process.env.ADMIN_SECRET || "easy-games")).toString("base64");
}

export async function setAdminSession() {
  const token = await getAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const expected = await getAdminToken();
  return token === expected;
}
