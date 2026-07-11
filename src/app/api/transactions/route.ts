import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const paymentMethod = url.searchParams.get("paymentMethod");
  const type = url.searchParams.get("type");

  const conditions = [eq(transactions.userId, Number(userId))];
  if (paymentMethod && paymentMethod !== "all") {
    conditions.push(eq(transactions.paymentMethod, paymentMethod));
  }
  if (type && type !== "all") {
    conditions.push(eq(transactions.type, type));
  }

  const result = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.createdAt));

  return NextResponse.json({ transactions: result });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const created = await db
    .insert(transactions)
    .values({
      userId: body.userId,
      type: body.type,
      amount: body.amount,
      category: body.category,
      paymentMethod: body.paymentMethod,
      description: body.description || "",
      date: body.date,
      time: body.time,
    })
    .returning();

  const user = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  const currentTotal = parseFloat(user[0].totalBalance || "0");
  const currentCash = parseFloat(user[0].cashBalance || "0");
  const currentCard = parseFloat(user[0].cardBalance || "0");
  const amount = parseFloat(body.amount);

  const balanceChange = body.type === "income" ? amount : -amount;

  let newTotal = currentTotal + balanceChange;
  let newCash = currentCash;
  let newCard = currentCard;

  if (body.paymentMethod === "cash") {
    newCash = body.type === "income" ? currentCash + amount : currentCash - amount;
  } else {
    newCard = body.type === "income" ? currentCard + amount : currentCard - amount;
  }

  await db
    .update(users)
    .set({
      totalBalance: newTotal.toFixed(2),
      cashBalance: newCash.toFixed(2),
      cardBalance: newCard.toFixed(2),
    })
    .where(eq(users.id, body.userId));

  return NextResponse.json({ transaction: created[0] });
}

export async function DELETE(req: NextRequest) {
  const { id, userId } = await req.json();

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (transaction.length > 0) {
    const tx = transaction[0];
    const user = await db.select().from(users).where(eq(users.id, tx.userId)).limit(1);
    const currentTotal = parseFloat(user[0].totalBalance || "0");
    const currentCash = parseFloat(user[0].cashBalance || "0");
    const currentCard = parseFloat(user[0].cardBalance || "0");
    const amount = parseFloat(tx.amount);

    const balanceChange = tx.type === "income" ? -amount : amount;

    let newTotal = currentTotal + balanceChange;
    let newCash = currentCash;
    let newCard = currentCard;

    if (tx.paymentMethod === "cash") {
      newCash = tx.type === "income" ? currentCash - amount : currentCash + amount;
    } else {
      newCard = tx.type === "income" ? currentCard - amount : currentCard + amount;
    }

    await db
      .update(users)
      .set({
        totalBalance: newTotal.toFixed(2),
        cashBalance: newCash.toFixed(2),
        cardBalance: newCard.toFixed(2),
      })
      .where(eq(users.id, tx.userId));

    await db.delete(transactions).where(eq(transactions.id, id));
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (transaction.length === 0) {
    return NextResponse.json({ error: "İşlem bulunamadı" }, { status: 404 });
  }

  const oldTx = transaction[0];

  const user = await db.select().from(users).where(eq(users.id, oldTx.userId)).limit(1);
  const currentTotal = parseFloat(user[0].totalBalance || "0");
  const currentCash = parseFloat(user[0].cashBalance || "0");
  const currentCard = parseFloat(user[0].cardBalance || "0");
  const oldAmount = parseFloat(oldTx.amount);

  const oldBalanceChange = oldTx.type === "income" ? -oldAmount : oldAmount;

  let newTotal = currentTotal + oldBalanceChange;
  let newCash = currentCash;
  let newCard = currentCard;

  if (oldTx.paymentMethod === "cash") {
    newCash = oldTx.type === "income" ? currentCash - oldAmount : currentCash + oldAmount;
  } else {
    newCard = oldTx.type === "income" ? currentCard - oldAmount : currentCard + oldAmount;
  }

  const updated = await db
    .update(transactions)
    .set({
      amount: body.amount,
      category: body.category,
      paymentMethod: body.paymentMethod,
      description: body.description,
      date: body.date,
      time: body.time,
      type: body.type,
    })
    .where(eq(transactions.id, id))
    .returning();

  const newAmount = parseFloat(body.amount);
  const newBalanceChange = body.type === "income" ? newAmount : -newAmount;

  newTotal += newBalanceChange;
  if (body.paymentMethod === "cash") {
    newCash = body.type === "income" ? newCash + newAmount : newCash - newAmount;
  } else {
    newCard = body.type === "income" ? newCard + newAmount : newCard - newAmount;
  }

  await db
    .update(users)
    .set({
      totalBalance: newTotal.toFixed(2),
      cashBalance: newCash.toFixed(2),
      cardBalance: newCard.toFixed(2),
    })
    .where(eq(users.id, oldTx.userId));

  return NextResponse.json({ transaction: updated[0] });
}
