import type { Metadata } from "next";
import { Rubik, Nunito_Sans } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Chatbot } from "@/components/shared/chatbot";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CommerceHub - E-Commerce Management System",
  description: "A complete multi-role e-commerce platform for Admins, Sellers, and Customers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${rubik.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <QueryProvider>
          {children}
          <Chatbot />
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
