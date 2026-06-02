import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import AuthInitializer from "@/providers/AuthInitializer";
import ToasterProvider from "@/providers/ToasterProvider";

const googleSansFlex = localFont({
  src: [
    {
      path: "../public/font/static/GoogleSansFlex_9pt-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/font/static/GoogleSansFlex_9pt-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/font/static/GoogleSansFlex_9pt-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-google-sans-flex",
});

// const googleSansFlex = Google_Sans_Flex({
//   variable: "--font-google-sans-flex",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Viju - Account Officer Portal",
  description: "Admin and Officer portal for Viju",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={` ${googleSansFlex.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToasterProvider />
        <ReactQueryProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
