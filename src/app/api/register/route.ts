import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ user: { id: existing[0].id, email: existing[0].email } });
  }

  const hashed = await bcrypt.hash(password, 10);
  const created = await db
    .insert(users)
    .values({ email, password: hashed })
    .returning();

  return NextResponse.json({ user: { id: created[0].id, email: created[0].email } });
}
