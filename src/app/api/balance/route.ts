import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  const user = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    balance: {
      total: user[0].totalBalance,
      cash: user[0].cashBalance,
      card: user[0].cardBalance,
    },
  });
}
