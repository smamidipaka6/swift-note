import type { Metadata } from "next";
import "./globals.css";

// Vercel Deployment Tools/Analytics
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

import { ThemeProvider } from "@/components/theme-provider";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";
import { NotesProvider } from "@/contexts/NotesContext";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Swift Note Light",
  description: "Notion but fast — really fast",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <NotesProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            // disableTransitionOnChange
          >
            {children}
            <ServiceWorkerManager />
          </ThemeProvider>
        </NotesProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
