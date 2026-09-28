import { getResultsData } from "../../lib/api";
import Link from "next/link";
import { Search } from "lucide-react";

export default function LibraryPage() {
  const { data } = getResultsData();
  
  if (!data) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Compound Library</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A93AD]" size={16} />
          <input 
            type="text" 
            placeholder="Search by ID or name..." 
            className="bg-[#050A16] border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#22E3D0] w-[300px]"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.compounds.map(c => (
          <Link href={`/library/${c.id}`} key={c.id} className="glass-card hover:bg-white/5 transition-colors group p-5 block relative overflow-hidden">
            {c.type === "reference" && (
              <div className="absolute top-0 right-0 bg-[#A678F5]/20 text-[#A678F5] text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                Reference
              </div>
            )}
            <div className="h-40 bg-white rounded-lg p-2 mb-4 flex items-center justify-center">
              <img src={c.svg_path} alt={c.name} className="max-h-full max-w-full" />
            </div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#22E3D0] transition-colors">{c.id}</h3>
                <p className="text-[#8A93AD] text-xs truncate max-w-[150px]" title={c.name}>{c.name}</p>
              </div>
              <div className={`pill-${c.safety_class || 'unknown'}`}>{c.safety_class ? `${c.safety_class} RISK` : 'UNKNOWN'}</div>
            </div>
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-[#8A93AD]">Vina Score</span>
              <span className="font-mono text-[#3DDC97]">{c.vina_score?.toFixed(3) ?? 'N/A'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
