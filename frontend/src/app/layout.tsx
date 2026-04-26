import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import GlobalLoadingCursor from "@/components/GlobalLoadingCursor";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TaskFlow | Kanban",
  description: "Manage your tasks seamlessly with TaskFlow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background antialiased flex flex-col`}>
        <GlobalLoadingCursor />
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
