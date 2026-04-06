import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PA Latency Lab — Capital Markets Lessons for AI Systems",
  description:
    "Interactive demo: how parallel tool execution and semantic caching cut prior authorization latency — architecture lessons from FX trading systems applied to healthcare AI.",
  openGraph: {
    title: "PA Latency Lab",
    description: "Sequential vs parallel AI tool calls in healthcare prior authorization. By Neelima V.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
