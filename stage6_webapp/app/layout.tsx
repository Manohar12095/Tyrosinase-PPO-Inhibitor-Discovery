import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ProfileMenu from "../components/ProfileMenu";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "CTRL+CELL: Tyrosinase Inhibitor Discovery",
  description: "Computational drug-discovery results — tyrosinase/PPO inhibition for food and cosmetics",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script src="https://3Dmol.org/build/3Dmol-min.js" defer></script>
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <header className="glass-header flex items-center justify-between px-[56px]">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill="#22E3D0"/>
              <circle cx="18" cy="6" r="3" fill="#A678F5"/>
              <circle cx="6" cy="18" r="3" fill="#A678F5"/>
              <path d="M12 12L18 6M12 12L6 18" stroke="white" strokeWidth="2"/>
            </svg>
            <span className="font-bold text-white tracking-widest">CTRL+CELL</span>
          </div>
          
          <nav className="hidden lg:flex items-center h-full gap-8">
            <Link href="/" className="h-full flex items-center relative text-white">
              Dashboard
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#22E3D0] via-[#5B8CFF] to-[#A678F5]"></div>
            </Link>
            <Link href="/library" className="h-full flex items-center text-[#8A93AD] hover:text-white transition-colors">
              Compound Library
            </Link>
            <Link href="/results" className="h-full flex items-center text-[#8A93AD] hover:text-white transition-colors">
              Screening Results
            </Link>
            <Link href="/analysis" className="h-full flex items-center text-[#8A93AD] hover:text-white transition-colors">
              Analysis
            </Link>
            <Link href="/api-access" className="h-full flex items-center text-[#8A93AD] hover:text-white transition-colors">
              API Access
            </Link>
          </nav>
          
          <div className="flex items-center gap-2">
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1320px] mx-auto px-[56px] py-12">
          {children}
        </main>
        
        <footer className="border-t border-white/[0.08] py-8 px-[56px] mt-auto">
          <p className="text-[#8A93AD] text-sm text-center">
            Team CTRL+CELL. Docking with AutoDock Vina 1.2.7 against PDB 2Y9X.
          </p>
        </footer>
      </body>
    </html>
  );
}
