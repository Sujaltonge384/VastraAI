import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar/Navbar";
import Toast from "../components/Toast/Toast";
import VoiceShopping from "../components/VoiceShopping";

export const metadata: Metadata = {
  title: "VastraAI",
  description: "AI-Powered Fashion E-Commerce Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <Toast />

        {children}

        <VoiceShopping />
      </body>
    </html>
  );
}