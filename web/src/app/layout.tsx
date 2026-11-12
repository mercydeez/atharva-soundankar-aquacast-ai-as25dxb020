import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/components/data-provider";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AQUACAST AI | Beverage Sales Forecasting",
  description:
    "Forecast Better. Produce Smarter. Distribute with Confidence. Monthly beverage demand forecasting with MAPE/WAPE model comparison and a Gemini AI copilot. Atharva Soundankar, AS25DXB020.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
