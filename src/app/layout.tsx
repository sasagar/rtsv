import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import HeaderWrapper from '@/components/layout/HeaderWrapper'; // HeaderWrapper をインポート

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-time Survey Tool",
  description: "A real-time audience reaction tool",
};

/**
 * The root layout component for the application.
 * It wraps the entire application with an authentication provider and a header.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The rendered root layout component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.className}>
      <body>
        <AuthProvider>
          <HeaderWrapper />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}