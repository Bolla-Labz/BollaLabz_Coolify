import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Force dynamic rendering - prevents static generation which requires valid Clerk credentials
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "BollaLabz Command Center",
  description: "AI-powered personal command center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
