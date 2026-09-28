import { getResultsData } from "../../../lib/api";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import Viewer3DWrapper from "../../../components/Viewer3DWrapper";

export default async function CompoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { data } = getResultsData();
  
  if (!data) return <div className="text-white text-center mt-20">Loading...</div>;
  
  const compound = data.compounds.find(c => c.id === resolvedParams.id);
  const idx = data.compounds.findIndex(c => c.id === resolvedParams.id);
  
  if (!compound) return <div className="text-white text-center mt-20">Compound not found</div>;
  
  const prevId = idx > 0 ? data.compounds[idx - 1].id : null;
  const nextId = idx < data.compounds.length - 1 ? data.compounds[idx + 1].id : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <Link href="/library" className="flex items-center gap-2 text-[#8A93AD] hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Library
        </Link>
        <div className="flex gap-4">
          {prevId && <Link href={`/library/${prevId}`} className="text-sm text-[#5B8CFF] hover:text-[#22E3D0]">← Previous</Link>}
          {nextId && <Link href={`/library/${nextId}`} className="text-sm text-[#5B8CFF] hover:text-[#22E3D0]">Next →</Link>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="glass-card p-6 flex flex-col items-center">
          <div className="w-full bg-white rounded-lg p-4 mb-6 flex justify-center h-64 items-center">
            <img src={compound.svg_path} alt={compound.id} className="max-w-full max-h-full" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{compound.id}</h1>
          <p className="text-[#8A93AD] text-sm text-center mb-6">{compound.name}</p>
          
          <div className="w-full space-y-4">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">Type</span>
              <span className="text-white uppercase text-sm">{compound.type}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">Safety Class</span>
              <span className={`pill-${compound.safety_class || 'unknown'} uppercase`}>{compound.safety_class || 'UNKNOWN'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">Vina Score</span>
              <span className="font-mono text-[#3DDC97]">{compound.vina_score?.toFixed(3) ?? 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">MW</span>
              <span className="font-mono text-white">{compound.mw.toFixed(1)}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">LogP</span>
              <span className="font-mono text-white">{compound.logp.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-[#8A93AD] text-sm">TPSA</span>
              <span className="font-mono text-white">{compound.tpsa.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-white">3D Pose vs 2Y9X Receptor</h3>
               <a href={compound.pose_file} download className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md transition-colors">
                 <Download size={14} /> Download PDBQT
               </a>
             </div>
             <div className="flex-1 relative rounded-lg overflow-hidden bg-black/40 border border-white/5">
                <Viewer3DWrapper pdbUrl={`/data/structures/receptor.pdbqt`} ligandUrl={compound.pose_file} />
             </div>
             {compound.copper_distance_a && (
               <p className="text-xs text-[#8A93AD] mt-3 text-center">
                 Ligand-to-Cu Distance: <span className="text-white font-mono">{compound.copper_distance_a} Å</span>
                 {compound.copper_distance_a > 8 && <span className="text-[#F0625D] ml-2">(outside active site)</span>}
               </p>
             )}
          </div>
          
          <div className="glass-card p-6">
             <h3 className="text-lg font-bold text-white mb-4">Rationale</h3>
             <p className="text-[#8A93AD] text-sm leading-relaxed">{compound.rationale || "No specific rationale provided."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
