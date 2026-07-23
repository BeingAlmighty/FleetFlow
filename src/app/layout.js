import { Inter } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});
export const metadata = {
  title: "Fleet Operations Platform",
  description: "Enterprise Fleet Management for E-Rickshaws",
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextTopLoader color="#4f46e5" showSpinner={false} height={3} />
        {children}
      </body>
    </html>
  );
}
