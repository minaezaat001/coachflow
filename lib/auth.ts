import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "coachflow-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  if (user.suspended) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name || "Coach";
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { whatsapp: true },
  });
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role || "coach",
    whatsapp: dbUser?.whatsapp || null,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "super_admin") throw new Error("Forbidden");
  return user;
}

export async function registerUser(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return null;

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const session = await getSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name || "Coach";
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
