import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient();
try {
  const user = await p.user.findUnique({ where: { email: "miki@coachflow.app" } });
  if (!user) { console.log("USER NOT FOUND"); process.exit(1); }
  console.log("Found:", user.email, user.name, user.role);
  const test = await bcrypt.compare("Miki@Admin2026", user.passwordHash);
  console.log("Password match:", test);
  // Try logging in via loginUser
  const { loginUser } = await import("./lib/auth");
  const result = await loginUser("miki@coachflow.app", "Miki@Admin2026");
  console.log("loginUser result:", result ? "SUCCESS" : "FAILED");
} finally { await p.$disconnect(); }
