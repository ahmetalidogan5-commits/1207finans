import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { currencyTransactions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const currency = url.searchParams.get("currency");

  let query = db
    .select()
    .from(currencyTransactions)
    .where(and(eq(currencyTransactions.userId, Number(userId)), eq(currencyTransactions.type, "buy")));

  const result = await query.orderBy(desc(currencyTransactions.createdAt));

  if (currency && currency !== "all") {
    const filtered = result.filter((t) => t.currency === currency);
    return NextResponse.json({ transactions: filtered });
  }

  return NextResponse.json({ transactions: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "sell") {
    // Check if user has enough currency
    const buyTxs = await db
      .select()
      .from(currencyTransactions)
      .where(
        and(
          eq(currencyTransactions.userId, body.userId),
          eq(currencyTransactions.currency, body.currency),
          eq(currencyTransactions.type, "buy")
        )
      );

    const totalBought = buyTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    if (totalBought < parseFloat(body.amount)) {
      return NextResponse.json(
        { error: `Yetersiz ${body.currency} bakiyesi. Toplam: ${totalBought}` },
        { status: 400 }
      );
    }

    // Sell from earliest purchases first (FIFO)
    let remaining = parseFloat(body.amount);
    for (const tx of buyTxs) {
      if (remaining <= 0) break;
      const available = parseFloat(tx.amount);
      if (available <= remaining) {
        await db.delete(currencyTransactions).where(eq(currencyTransactions.id, tx.id));
        remaining -= available;
      } else {
        const newAmount = available - remaining;
        const newTotal = parseFloat(tx.totalPrice) * (newAmount / available);
        await db
          .update(currencyTransactions)
          .set({
            amount: newAmount.toFixed(4),
            totalPrice: newTotal.toFixed(2),
          })
          .where(eq(currencyTransactions.id, tx.id));
        remaining = 0;
      }
    }
  }

  const created = await db
    .insert(currencyTransactions)
    .values({
      userId: body.userId,
      currency: body.currency,
      amount: body.amount,
      buyPrice: body.buyPrice,
      totalPrice: body.totalPrice,
      source: body.source || "",
      type: body.type,
      date: body.date,
      time: body.time,
    })
    .returning();

  return NextResponse.json({ transaction: created[0] });
}

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json();
  await db
    .delete(currencyTransactions)
    .where(eq(currencyTransactions.id, id));
  return NextResponse.json({ success: true });
    }
        
