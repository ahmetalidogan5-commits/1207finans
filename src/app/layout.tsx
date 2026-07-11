import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finans Takip - Kişisel Panel",
  description: "Kişisel finans yönetim paneli",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
