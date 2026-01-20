import "./globals.css";

export const metadata = {
  title: "OdyCard",
  description: "OdyCard Owner App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}