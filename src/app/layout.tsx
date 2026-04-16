import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header/Header";
import { ThemeProvider } from "@/components/ThemeProvider/ThemeProvider";

export const metadata: Metadata = {
  title: "Rhizome - 物語を分岐させよう",
  description: "個人アニメーション制作をオープンソースの共創へ。物語の断面から新しい枝を生やし、無数の並行世界が共生する巨大な物語の地図を作り上げるプラットフォーム。",
  keywords: ["アニメーション", "AI", "共創", "ストーリーマップ", "分岐", "オープンソース"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <Header />
          <main className="page-container">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
