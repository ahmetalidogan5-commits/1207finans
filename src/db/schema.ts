import { pgTable, serial, text, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  totalBalance: numeric("total_balance", { precision: 15, scale: 2 }).default("0"),
  cashBalance: numeric("cash_balance", { precision: 15, scale: 2 }).default("0"),
  cardBalance: numeric("card_balance", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 50 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const currencyTransactions = pgTable("currency_transactions", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  currency: varchar("currency", { length: 10 }).notNull(), // USD, EUR, GBP, etc.
  amount: numeric("amount", { precision: 15, scale: 4 }).notNull(), // kaç adet
  buyPrice: numeric("buy_price", { precision: 15, scale: 4 }).notNull(), // alış kuru
  totalPrice: numeric("total_price", { precision: 15, scale: 2 }).notNull(), // toplam TL
  source: varchar("source", { length: 200 }), // nereden alındı
  type: varchar("type", { length: 50 }).notNull(), // buy or sell
  date: varchar("date", { length: 50 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
