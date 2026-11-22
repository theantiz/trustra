import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Trustra | Real-Time Fintech Trust Engine",
  description:
    "Trustra is an institutional-grade trust scoring engine evaluating counterparty risk in digital payment networks using real-time behavioral signals, graph network propagation, and fraud detection.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
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
        className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans"
        suppressHydrationWarning
      >
        <Navbar />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="font-semibold text-slate-700">Trustra</span> Risk & Trust Engine &copy; {new Date().getFullYear()}
            </p>
            <p className="text-[11px] text-slate-400">
              Deterministic Scoring &bull; Idempotent Processing &bull; Graph Propagation
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
