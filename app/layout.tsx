// app/layout.tsx
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google"; // Or your chosen font like Geist
import "./globals.css"; //
import { cn } from "@/lib/utils"; //
import { PulpitLayout } from "@/components/layout/PulpitLayout"; // Import the new layout
import { ThemeProvider } from "next-themes";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "PulpitStream - Twitch Style",
  description: "A new layout for PulpitStream",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased", //
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // Set dark theme as default
          enableSystem
          disableTransitionOnChange
        >
          <PulpitLayout showRightPanel={true}> {/* Or conditionally based on route/page */}
            {children}
          </PulpitLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}