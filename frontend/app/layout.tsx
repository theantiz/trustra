import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trustra",
  description:
    "Trustra is a real time trust scoring engine that evaluates the reliability of users in digital payment systems using behavioral signals, transaction history, and feedback patterns.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-gray-50 text-gray-900 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
