import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user[0].password);
  if (!isValid) {
    return NextResponse.json({ error: "Geçersiz şifre" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user[0].id,
      email: user[0].email,
      totalBalance: user[0].totalBalance,
      cashBalance: user[0].cashBalance,
      cardBalance: user[0].cardBalance,
    },
  });
}
