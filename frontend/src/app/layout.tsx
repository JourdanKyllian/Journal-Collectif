import type { Metadata } from "next";
import { Montserrat, Poppins, Raleway } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", weight: ["400", "600", "700", "900"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-poppins" });
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-raleway" });

export const metadata: Metadata = {
  title: "Collectif Chalonnais 06",
  description: "Journal Municipal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${montserrat.variable} ${poppins.variable} ${raleway.variable} font-montserrat antialiased bg-blanc text-noir min-h-screen`}>
        {/* On ne met plus rien ici, chaque groupe aura son propre layout */}
        {children}
      </body>
    </html>
  );
}