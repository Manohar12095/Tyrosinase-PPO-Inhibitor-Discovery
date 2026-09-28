import { getResultsData } from "../../lib/api";
import Link from "next/link";
import { Download } from "lucide-react";

export default function ResultsPage() {
  const { data } = getResultsData();
  
  if (!data) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Screening Results</h1>
        <a href="/api/export.csv" download className="flex items-center gap-2 bg-gradient-to-r from-[#22E3D0] to-[#5B8CFF] text-[#050A16] font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Download size={16} /> Export CSV
        </a>
      </div>
      
      <div className="glass-card p-6 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#8A93AD] bg-white/[0.02]">
                <th className="p-3">Rank</th>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Vina Score</th>
                <th className="p-3">Safety</th>
                <th className="p-3">MW</th>
                <th className="p-3">LogP</th>
                <th className="p-3">TPSA</th>
                <th className="p-3">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.compounds.sort((a,b) => (a.rank||999)-(b.rank||999)).map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-[#8A93AD]">{c.rank || '-'}</td>
                  <td className="p-3 font-medium text-white hover:text-[#22E3D0] transition-colors">
                    <Link href={`/library/${c.id}`}>{c.id}</Link>
                  </td>
                  <td className="p-3 text-white truncate max-w-[200px]" title={c.name}>{c.name}</td>
                  <td className="p-3">
                    <span className="text-xs text-[#8A93AD] uppercase">{c.type}</span>
                  </td>
                  <td className="p-3 font-mono text-[#3DDC97]">{c.vina_score?.toFixed(3) ?? 'N/A'}</td>
                  <td className="p-3">
                    <span className={`pill-${c.safety_class || 'unknown'} uppercase text-[10px]`}>
                      {c.safety_class || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-white">{c.mw.toFixed(1)}</td>
                  <td className="p-3 font-mono text-white">{c.logp.toFixed(2)}</td>
                  <td className="p-3 font-mono text-white">{c.tpsa.toFixed(1)}</td>
                  <td className="p-3 font-mono text-white">{c.composite_score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
