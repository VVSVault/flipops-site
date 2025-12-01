import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Force dynamic rendering to ensure Clerk is properly initialized
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "FlipOps - Automation for Real Estate Investors & House Flippers",
  description: "Find more deals, analyze faster, and keep projects on budget with AI-powered automation built by an active real estate investor.",
  keywords: "real estate automation, house flipping software, real estate investor tools, deal analysis, property management automation",
  openGraph: {
    title: "FlipOps - Automation for Real Estate Investors",
    description: "Find more deals, analyze faster, and keep projects on budget with AI-powered automation.",
    type: "website",
    url: "https://flipops.io",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "FlipOps - Real Estate Automation"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "FlipOps - Automation for Real Estate Investors",
    description: "Find more deals, analyze faster, and keep projects on budget with AI-powered automation.",
    images: ["/og-image.png"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
