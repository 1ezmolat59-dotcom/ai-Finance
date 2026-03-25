import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "../components/CurrencyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Finance Tracker — Smart Money, Smarter Decisions",
  description:
    "Track expenses, get AI-powered insights, set budget alerts, and take control of your finances with the most intelligent personal finance platform.",
  keywords: [
    "AI finance",
    "budget tracker",
    "expense tracking",
    "financial insights",
    "personal finance",
    "money management",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
      </body>
    </html>
  );
}
