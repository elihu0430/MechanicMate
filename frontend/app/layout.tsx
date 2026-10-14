import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MechanicMate — Workshop Management System",
  description:
    "Digital bay assistant & automotive repair order management system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_cHJlY2lzZS13YWxydXMtMjE5MC5jbGVyay5hY2NvdW50cy5kZXYk";
  const isClerkConfigured = !!(clerkKey && clerkKey.trim().startsWith("pk_"));

  const bodyContent = (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white selection:bg-[#22c55e] selection:text-black">
        {children}
      </body>
    </html>
  );

  if (isClerkConfigured) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
        afterSignOutUrl="/sign-in"
      >
        {bodyContent}
      </ClerkProvider>
    );
  }

  return bodyContent;
}
