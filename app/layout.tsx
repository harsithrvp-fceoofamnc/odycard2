import "./globals.css";
import { LoaderProvider } from "@/context/LoaderContext";
import Analytics from "@/components/Analytics";

export const metadata = {
  title: "OdyCard",
  description: "OdyCard Owner App",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* renders nothing; no-op unless NEXT_PUBLIC_GA_ID is set */}
        <Analytics />
        <LoaderProvider>
          {children}
        </LoaderProvider>
      </body>
    </html>
  );
}
