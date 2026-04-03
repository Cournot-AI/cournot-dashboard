import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { RouteTracker } from "@/components/layout/route-tracker";
import { Toaster } from "sonner";
import { GA_ID } from "@/lib/analytics";
import { RoleProvider } from "@/components/auth/role-provider";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Oracle — Prediction Market Resolution",
  description: "AI Oracle dashboard for prediction market resolution and audit",
  icons: {
    icon: "/cournot_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-[family-name:var(--font-geist-sans)] antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <RoleProvider>
            <SidebarProvider>
            <RouteTracker />
            <Topbar />
            <div className="flex">
              <Sidebar />
              <main className="ml-0 md:ml-52 flex-1 min-h-[calc(100vh-3.5rem)]">
                <div className="p-4 md:p-6 max-w-[1400px] mx-auto">{children}</div>
              </main>
            </div>
            </SidebarProvider>
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(228 14% 10%)",
                  border: "1px solid hsl(224 12% 16%)",
                  color: "hsl(210 20% 96%)",
                },
              }}
            />
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
