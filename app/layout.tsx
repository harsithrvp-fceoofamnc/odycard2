import "./globals.css";
import { LoaderProvider } from "@/context/LoaderContext";

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
        <LoaderProvider>
          {children}
        </LoaderProvider>
      </body>
    </html>
  );
}
