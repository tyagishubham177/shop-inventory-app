import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Shop Inventory App",
  description: "Mobile-first inventory and sales app scaffold for the internal shop team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
