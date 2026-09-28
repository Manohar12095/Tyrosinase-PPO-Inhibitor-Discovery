import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CTRL+CELL: Tyrosinase Inhibitor Discovery",
  description: "Computational drug-discovery results — tyrosinase/PPO inhibition for food and cosmetics",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* 3Dmol.js — loaded as a plain defer script, no Next.js Script magic needed */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var s = document.createElement('script');
                s.src = 'https://3Dmol.org/build/3Dmol-min.js';
                s.defer = true;
                document.head.appendChild(s);
              })();
            `,
          }}
        />
      </head>
      <body>
        <nav className="nav-bar">
          <div className="nav-logo">CTRL+CELL</div>
          <a href="/api/dossier" className="nav-link">
            Download dossier
          </a>
        </nav>
        <main>{children}</main>
        <footer className="site-footer">
          <p>Team CTRL+CELL. Hackathon 2026.</p>
          <p>AutoDock Vina v1.2.7. Target PDB 2Y9X.</p>
          <p>No values fabricated.</p>
        </footer>
      </body>
    </html>
  );
}
