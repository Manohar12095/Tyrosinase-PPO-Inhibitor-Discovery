import Link from "next/link";
import { Terminal, Database, FileJson, Link2 } from "lucide-react";

export default function ApiAccessPage() {
  const routes = [
    {
      path: "/api/summary",
      desc: "Top-level counts, best score, target ID, and generation timestamp.",
      method: "GET"
    },
    {
      path: "/api/compounds",
      desc: "List of all compounds. Query params: q, type, safety, sort, order, limit.",
      method: "GET"
    },
    {
      path: "/api/compounds/[id]",
      desc: "Detailed record for a specific compound ID.",
      method: "GET"
    },
    {
      path: "/api/references",
      desc: "List of reference inhibitors used for baseline comparison.",
      method: "GET"
    },
    {
      path: "/api/meta",
      desc: "Pipeline metadata (tool versions, docking box, weights).",
      method: "GET"
    },
    {
      path: "/api/export.csv",
      desc: "Raw CSV export of all compound properties and scores.",
      method: "GET"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#5B8CFF]/20 flex items-center justify-center">
          <Terminal className="text-[#5B8CFF]" />
        </div>
        <h1 className="text-3xl font-bold text-white">API Access</h1>
      </div>
      
      <p className="text-[#8A93AD] max-w-3xl">
        All data displayed in this dashboard is available programmatically via REST endpoints. 
        These routes are read-only and serve the static compilation of the Vina docking results 
        and RDKit safety descriptors.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route, i) => (
          <div key={i} className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold bg-[#3DDC97]/20 text-[#3DDC97] px-2 py-1 rounded">
                  {route.method}
                </span>
                <Link2 size={16} className="text-[#8A93AD]" />
              </div>
              <h2 className="text-xl font-mono text-white mb-2 truncate" title={route.path}>{route.path}</h2>
              <p className="text-sm text-[#8A93AD]">{route.desc}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10">
              <a 
                href={route.path.replace('[id]', 'NOV001')} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-[#5B8CFF] hover:text-[#22E3D0] transition-colors flex items-center gap-2"
              >
                <FileJson size={14} /> 
                {route.path.includes('[id]') ? 'Test with NOV001' : 'Test Endpoint'}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
