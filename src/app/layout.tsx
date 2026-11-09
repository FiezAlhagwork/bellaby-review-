import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = { title: "Bellaby · Design" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}