import { NextRequest, NextResponse } from "next/server";

const GOLD_TYPES = [
  { key: "XAU", name: "Gram Altın", grams: 1 },
  { key: "CEYREK", name: "Çeyrek Altın", grams: 1.75 },
  { key: "YARIM", name: "Yarım Altın", grams: 3.5 },
  { key: "TAM", name: "Tam Altın", grams: 7.0 },
  { key: "CUMHURIYET", name: "Cumhuriyet Altını", grams: 7.2 },
  { key: "ATA", name: "Ata Altın", grams: 7.2 },
  { key: "BESLI", name: "5'li Bilezik", grams: 17.5 },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "SAR", "AED", "RUB"];

export async function GET() {
  try {
    // Fetch currency rates and gold price in parallel
    const [fxRes, goldRes] = await Promise.allSettled([
      fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 60 },
      }),
      fetch("https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD", {
        next: { revalidate: 60 },
      }),
    ]);

    // Currency data
    if (fxRes.status !== "fulfilled" || !fxRes.value.ok) {
      return NextResponse.json({ error: "Döviz kuru alınamadı" }, { status: 500 });
    }

    const fxData = await fxRes.value.json();
    if (!fxData || !fxData.rates) {
      return NextResponse.json({ error: "Kur verisi geçersiz" }, { status: 500 });
    }

    const tryRate = fxData.rates.TRY;
    const rates: Record<string, { tryBuy: number; trySell: number; name: string; change: number }> = {};

    // Currency rates
    for (const curr of CURRENCIES) {
      const rate = fxData.rates[curr];
      if (rate && tryRate) {
        const tryBuy = parseFloat((tryRate / rate).toFixed(4));
        const trySell = parseFloat((tryBuy * 1.005).toFixed(4));
        rates[curr] = { tryBuy, trySell, name: `${curr}/TRY`, change: 0 };
      }
    }

    // Gold rates from Swissquote
    if (goldRes.status === "fulfilled" && goldRes.value.ok) {
      const goldData = await goldRes.value.json();
      if (goldData && goldData.length > 0) {
        // Get first valid price
        const first = goldData[0];
        const spreadProfile = first.spreadProfilePrices?.[0];
        if (spreadProfile) {
          const xauUsdPerOz = spreadProfile.bid; // USD per troy ounce
          const xauUsdPerGram = xauUsdPerOz / 31.1035;
          const xauTryPerGram = xauUsdPerGram * tryRate;

          for (const goldInfo of GOLD_TYPES) {
            const tryBuy = parseFloat((xauTryPerGram * goldInfo.grams).toFixed(4));
            const trySell = parseFloat((tryBuy * 1.005).toFixed(4));
            rates[goldInfo.key] = {
              tryBuy,
              trySell,
              name: goldInfo.name,
              change: 0,
            };
          }
        }
      }
    }

    return NextResponse.json({ rates, updatedAt: fxData.time_last_update_utc });
  } catch (err) {
    console.error("Currency API error:", err);
    return NextResponse.json(
      { error: "Kur verisi alınamadı, lütfen tekrar deneyin" },
      { status: 500 }
    );
  }
}
