import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markdown AI Canvas",
  description: "AI-powered markdown editor with canvas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
