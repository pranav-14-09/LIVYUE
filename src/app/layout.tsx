import type { Metadata } from "next";
import { instrumentSans, instrumentSerif } from "@/lib/fonts";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIVYUE — Live Yourself Everyday",
  description:
    "LIVYUE — Live Yourself Everyday. A simple space to set intentions, reflect on your days, and understand the patterns that shape how you live.",
  keywords: [
    "LIVYUE",
    "Live Yourself Everyday",
    "daily reflection",
    "intentions",
    "journal",
    "mindful companion",
    "habits",
    "privacy focused",
  ],
  authors: [{ name: "LIVYUE" }],
  creator: "LIVYUE",
  publisher: "LIVYUE",
  applicationName: "LIVYUE",
  openGraph: {
    title: "LIVYUE — Live Yourself Everyday",
    description:
      "LIVYUE — Live Yourself Everyday. A simple space to set intentions, reflect on your days, and understand the patterns that shape how you live.",
    siteName: "LIVYUE",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LIVYUE — Live Yourself Everyday",
    description:
      "LIVYUE — Live Yourself Everyday. A simple space to set intentions, reflect on your days, and understand the patterns that shape how you live.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('livyue_theme');
                if (!theme) {
                  var raw = localStorage.getItem('livyue_store_v1');
                  if (raw) {
                    var parsed = JSON.parse(raw);
                    if (parsed && parsed.settings && parsed.settings.themeMode) {
                      theme = parsed.settings.themeMode;
                    }
                  }
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full bg-paper font-sans text-ink">
        <ThemeProvider>
          <div className="grain" aria-hidden />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
