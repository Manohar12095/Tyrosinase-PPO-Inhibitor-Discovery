"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Download, ChevronRight } from "lucide-react";
import { Results, Compound } from "../lib/schema";
import Viewer3DWrapper from "./Viewer3DWrapper";

const RADAR_COLORS = ["#5B6CFF", "#F0625D", "#F5C242", "#9B6BFF", "#2DD4A7"];

export default function DashboardContent({ data }: { data: Results }) {
  const allRanked = [...data.compounds].filter(c => c.type === "candidate").sort((a, b) => (a.rank || 999) - (b.rank || 999));
  const defaultTop5 = allRanked.slice(0, 5);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultTop5.map(c => c.id));
  
  const selectedCompounds = useMemo(() => {
    return selectedIds.map(id => data.compounds.find(c => c.id === id)).filter(Boolean) as Compound[];
  }, [selectedIds, data.compounds]);

  const radarData = useMemo(() => {
    // Normalization logic: min-max normalization
    const minMax = {
      vina: { min: Math.min(...data.compounds.map(c => c.vina_score || 0)), max: Math.max(...data.compounds.map(c => c.vina_score || 0)) },
      mw: { min: Math.min(...data.compounds.map(c => c.mw)), max: Math.max(...data.compounds.map(c => c.mw)) },
      logp: { min: Math.min(...data.compounds.map(c => c.logp)), max: Math.max(...data.compounds.map(c => c.logp)) },
      tpsa: { min: Math.min(...data.compounds.map(c => c.tpsa)), max: Math.max(...data.compounds.map(c => c.tpsa)) },
      hbd: { min: Math.min(...data.compounds.map(c => c.hbd)), max: Math.max(...data.compounds.map(c => c.hbd)) },
    };

    const norm = (val: number, min: number, max: number, invert = false) => {
      if (max === min) return 0.5;
      const v = (val - min) / (max - min);
      return invert ? 1 - v : v;
    };

    const axes = [
      { subject: "Vina Score", key: "vina", val: (c: Compound) => c.vina_score || 0, invert: true },
      { subject: "Molecular Weight", key: "mw", val: (c: Compound) => c.mw, invert: false },
      { subject: "LogP", key: "logp", val: (c: Compound) => c.logp, invert: false },
      { subject: "TPSA", key: "tpsa", val: (c: Compound) => c.tpsa, invert: false },
      { subject: "H-Bond Donors", key: "hbd", val: (c: Compound) => c.hbd, invert: false },
    ];

    return axes.map(axis => {
      const row: any = { subject: axis.subject };
      selectedCompounds.forEach((c, i) => {
        const raw = axis.val(c);
        row[c.id] = norm(raw, minMax[axis.key as keyof typeof minMax].min, minMax[axis.key as keyof typeof minMax].max, axis.invert);
        row[`${c.id}_raw`] = raw;
      });
      return row;
    });
  }, [selectedCompounds, data.compounds]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      if (selectedIds.length >= 5) return; // limit to 5
      setSelectedIds([...selectedIds, id]);
    }
  };

  const bestScore = Math.min(...data.compounds.map(c => c.vina_score || 999));
  const numScreened = data.compounds.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050A16]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }} className="text-sm">
              {p.dataKey}: {p.payload[`${p.dataKey}_raw`]?.toFixed(2) ?? "N/A"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const top1 = allRanked[0];
  const [active3DId, setActive3DId] = useState(top1?.id);

  return (
    <div className="space-y-16 pb-20 animate-fade-in">
      {/* Hero */}
      <section className="text-center relative">
        <h1 className="text-4xl md:text-[88px] font-extrabold tracking-tight text-gradient leading-tight inline-block relative">
          Stopping the Browning
          <div className="absolute inset-0 bg-[#22E3D0] blur-[120px] opacity-20 -z-10 mix-blend-screen rounded-full"></div>
        </h1>
        
        <div className="glass-card mx-auto mt-8 inline-flex items-center divide-x divide-white/[0.08] text-[26px] overflow-hidden">
          <div className="px-8 py-4 font-light text-white">{numScreened} Compounds Screened</div>
          <div className="px-8 py-4 font-light text-white">Best Score <span className="font-mono text-[#3DDC97]">{bestScore.toFixed(3)}</span> kcal/mol</div>
          <div className="px-8 py-4 font-light text-white">PDB {data.meta.pdb_id}</div>
        </div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6">
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4">Top Candidates</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#8A93AD] bg-white/[0.02]">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Molecule ID</th>
                  <th className="p-3">Vina Score</th>
                  <th className="p-3">Safety</th>
                  <th className="p-3">Composite Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {allRanked.slice(0, 10).map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(c.id)}
                        onChange={() => handleToggle(c.id)}
                        disabled={!selectedIds.includes(c.id) && selectedIds.length >= 5}
                        className="w-4 h-4 rounded border-white/20 bg-black/20 accent-[#22E3D0]"
                      />
                    </td>
                    <td className="p-3 font-medium text-white group-hover:text-[#22E3D0] transition-colors cursor-pointer">
                      <Link href={`/library/${c.id}`}>{c.id}</Link>
                    </td>
                    <td className="p-3 font-mono text-[#3DDC97]">{c.vina_score?.toFixed(3)}</td>
                    <td className="p-3">
                      <span className={`pill-${c.safety_class || 'unknown'} uppercase`}>
                        {c.safety_class ? `${c.safety_class} RISK` : 'NOT ASSESSED'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 text-right">{c.composite_score.toFixed(3)}</span>
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#22E3D0] to-[#5B8CFF]" 
                            style={{ width: `${Math.min(100, Math.max(0, c.composite_score * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href="/results" className="mt-4 text-sm text-[#5B8CFF] hover:text-[#22E3D0] transition-colors flex items-center gap-1">
            View all {numScreened} compounds <ChevronRight size={14} />
          </Link>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-white leading-tight">Multi-property comparison<br/>of the top 5 candidates</h2>
            <button 
              onClick={() => setSelectedIds(defaultTop5.map(c => c.id))}
              className="text-xs text-[#8A93AD] hover:text-white transition-colors"
            >
              Reset to top 5
            </button>
          </div>
          <p className="text-xs text-[#8A93AD] mb-6">Values are min-max normalized across all screened compounds.</p>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#8A93AD", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {selectedCompounds.map((c, i) => (
                  <Radar 
                    key={c.id}
                    name={c.id}
                    dataKey={c.id} 
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]} 
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]} 
                    fillOpacity={0.2}
                    isAnimationActive={false}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {selectedCompounds.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RADAR_COLORS[i % RADAR_COLORS.length] }}></div>
                <span className="text-white">{c.id}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlight & 3D Viewer */}
      {top1 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <span className="text-[#22E3D0] text-sm font-semibold uppercase tracking-wider">Top Candidate Spotlight</span>
              <h2 className="text-3xl font-bold text-white mt-2 mb-1">{top1.name}</h2>
              <p className="text-[#8A93AD] font-mono text-sm mb-6">{top1.id}</p>
              
              <div className="flex gap-6 mb-8 items-center">
                <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center">
                  <img src={top1.svg_path} alt={top1.id} className="max-w-full max-h-full" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="text-xs text-[#8A93AD]">Binding Affinity</div>
                    <div className="text-2xl font-mono text-[#3DDC97]">{top1.vina_score?.toFixed(3)} kcal/mol</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#8A93AD]">Safety Profile</div>
                    <div className="mt-1">
                      <span className={`pill-${top1.safety_class || 'unknown'} uppercase`}>{top1.safety_class} RISK</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-white font-medium mb-2">Design Rationale</h3>
                <p className="text-[#8A93AD] text-sm leading-relaxed">{top1.rationale || "No rationale provided."}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Link href={`/library/${top1.id}`} className="flex-1 text-center bg-white/10 hover:bg-white/15 text-white font-medium py-2 rounded-lg transition-colors border border-white/10">
                View details
              </Link>
              <a href="/api/dossier" className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-[#22E3D0] to-[#5B8CFF] text-[#050A16] hover:opacity-90 font-semibold py-2 rounded-lg transition-opacity">
                <Download size={16} /> Download dossier
              </a>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">3D Interaction Viewer</h3>
              <select 
                className="bg-[#050A16] border border-white/20 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-[#22E3D0]"
                value={active3DId}
                onChange={(e) => setActive3DId(e.target.value)}
              >
                {allRanked.slice(0,5).map(c => (
                  <option key={c.id} value={c.id}>{c.id} (Top {c.rank})</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative rounded-lg overflow-hidden bg-black/40 border border-white/5">
              <Viewer3DWrapper 
                pdbUrl={`/data/structures/receptor.pdbqt`} 
                ligandUrl={allRanked.find(c => c.id === active3DId)?.pose_file || ''} 
              />
            </div>
            {allRanked.find(c => c.id === active3DId)?.copper_distance_a && (
              <p className="text-xs text-[#8A93AD] mt-3 text-center">
                Distance to copper center: <span className="text-white font-mono">{allRanked.find(c => c.id === active3DId)?.copper_distance_a} Å</span>
                {(allRanked.find(c => c.id === active3DId)?.copper_distance_a ?? 0) > 8 && <span className="text-[#F0625D] ml-2">(outside active site)</span>}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Pipeline Strip */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center">
          <PipelineStep label="Target" count="1" isActive={false} />
          <PipelineDivider />
          <PipelineStep label="Design" count={data.compounds.length.toString()} isActive={false} />
          <PipelineDivider />
          <PipelineStep label="Dock" count={data.compounds.filter(c=>c.vina_score !== null).length.toString()} isActive={false} />
          <PipelineDivider />
          <PipelineStep label="Safety" count={data.compounds.filter(c=>c.safety_class !== null).length.toString()} isActive={false} />
          <PipelineDivider />
          <PipelineStep label="Rank" count={allRanked.length.toString()} isActive={true} />
        </div>
      </section>
    </div>
  );
}

function PipelineStep({ label, count, isActive }: { label: string, count: string, isActive: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-2xl font-mono mb-1 ${isActive ? 'text-[#22E3D0]' : 'text-white'}`}>{count}</div>
      <div className={`text-xs uppercase tracking-wider ${isActive ? 'text-[#22E3D0]' : 'text-[#8A93AD]'}`}>{label}</div>
    </div>
  );
}

function PipelineDivider() {
  return <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>;
}
