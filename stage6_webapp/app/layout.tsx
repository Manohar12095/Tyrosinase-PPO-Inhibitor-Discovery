import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ProfileMenu from "../components/ProfileMenu";
import Navigation from "../components/Navigation";

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
        <header className="glass-header flex items-center justify-between px-8 bg-[#050811]/90">
          <Link href="/" className="flex items-center gap-3 group">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" stroke="#00F2FE" strokeWidth="2.2" fill="none" />
              <circle cx="18" cy="6" r="3" stroke="#A855F7" strokeWidth="2.2" fill="none" />
              <circle cx="6" cy="18" r="3" stroke="#3B82F6" strokeWidth="2.2" fill="none" />
              <circle cx="4" cy="6" r="2" stroke="#00F2FE" strokeWidth="2" fill="none" />
              <path d="M12 12L18 6M12 12L6 18M12 12L4 6" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 2" />
            </svg>
            <span className="font-bold text-xl tracking-wider text-white group-hover:text-[#00F2FE] transition-colors uppercase">CTRL+CELL</span>
          </Link>
          
          <div className="hidden lg:flex">
            <Navigation />
          </div>
          
          <div className="flex items-center gap-2">
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-6">
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
