import type { Metadata } from "next";
import { Patrick_Hand, Open_Sans, Patrick_Hand_SC } from "next/font/google";
import "./globals.css";

// Handwritten font for headings - Bob's Burgers style
const patrickHand = Patrick_Hand_SC({
  weight: "400",
  variable: "--font-handwritten",
  subsets: ["latin"],
});

// Clean body font for readability
const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burger of the Daydle - Daily Bob's Burgers Puzzle Game",
  description: "Guess today's Bob's Burgers episode from hints! A Wordle-inspired daily puzzle game for fans of the Belcher family.",
  keywords: ["Bob's Burgers", "Wordle", "puzzle game", "daily game", "trivia"],
  openGraph: {
    title: "Burger of the Daydle",
    description: "Can you guess today's Bob's Burgers episode?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${patrickHand.variable} ${openSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
