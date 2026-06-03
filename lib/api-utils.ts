import { NextResponse } from "next/server";
import { requireAuth } from "./auth";

export async function withAuth(handler: (userId: string, req: Request) => Promise<NextResponse>) {
  return async (req: Request) => {
    try {
      const user = await requireAuth();
      return handler(user.id, req);
    } catch {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
  };
}

export async function getBody<T>(req: Request): Promise<T> {
  return req.json();
}
