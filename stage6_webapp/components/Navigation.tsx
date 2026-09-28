"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/library", label: "Compound Library" },
    { href: "/results", label: "Screening Results" },
    { href: "/analysis", label: "Analysis" },
    { href: "/api-access", label: "API Access" },
  ];

  return (
    <nav className="flex items-center gap-8">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        return (
          <div key={link.href} className="relative py-5">
            <Link 
              href={link.href}
              className={`text-sm transition-colors ${
                isActive 
                  ? "text-[#00F2FE] font-semibold" 
                  : "text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              {link.label}
            </Link>
            {isActive && (
              <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(0,242,254,0.8)]" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
