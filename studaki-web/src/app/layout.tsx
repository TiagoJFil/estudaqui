import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Studaki - Your Study Companion",
  description: "Study smarter with Studaki, your personal study companion.",
  icons: {
    icon: '/icon_no_bg.png',
    apple: '/icon_no_bg.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
