import type { Metadata } from "next";
import { Literata, Outfit } from "next/font/google";
import "./globals.css";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Literata({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuietFind · Actually quiet places to work",
  description:
    "Find London libraries, cafés, and corners ranked by hush level — not just star ratings. Save favorites and log how quiet it felt. No account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
