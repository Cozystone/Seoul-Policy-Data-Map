import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPDM | Seoul Policy Data Map",
  description:
    "Seoul Policy Data Map is a policy rehearsal dashboard for impact paths, public reaction, and mitigation planning."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
