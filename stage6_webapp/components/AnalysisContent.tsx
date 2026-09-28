"use client";

import { useMemo } from "react";
import { Results, Compound } from "../lib/schema";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AnalysisContent({ data }: { data: Results }) {
  const getSafetyColor = (safety: string | null) => {
    if (safety === "low") return "#4ADE80";
    if (safety === "moderate") return "#F5B942";
    if (safety === "high") return "#F0625D";
    return "#8A93AD";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#050A16]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-medium mb-1">{data.id} <span className="text-xs text-[#8A93AD] font-normal uppercase">({data.type})</span></p>
          <p className="text-sm" style={{ color: getSafetyColor(data.safety_class) }}>Safety: {data.safety_class || 'UNKNOWN'}</p>
          <p className="text-sm text-[#8A93AD]">Vina Score: <span className="text-[#3DDC97] font-mono">{data.vina_score?.toFixed(3)}</span></p>
          <p className="text-sm text-[#8A93AD]">MW: <span className="text-white font-mono">{data.mw.toFixed(1)}</span> | LogP: <span className="text-white font-mono">{data.logp.toFixed(2)}</span></p>
        </div>
      );
    }
    return null;
  };

  const chartData = data.compounds.filter((c: Compound) => c.vina_score !== null);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white">Analysis & Ranking</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-bold text-white mb-2">Vina Score vs LogP</h2>
          <p className="text-xs text-[#8A93AD] mb-6">Lower Vina Score indicates stronger predicted binding.</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" dataKey="logp" name="LogP" stroke="#8A93AD" tick={{ fill: "#8A93AD" }} />
                <YAxis type="number" dataKey="vina_score" name="Vina Score" reversed stroke="#8A93AD" tick={{ fill: "#8A93AD" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Compounds" data={chartData}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getSafetyColor(entry.safety_class)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col h-[400px]">
          <h2 className="text-xl font-bold text-white mb-2">Vina Score vs Molecular Weight</h2>
          <p className="text-xs text-[#8A93AD] mb-6">Colored by safety class (Green=Low, Yellow=Moderate, Red=High).</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" dataKey="mw" name="MW" stroke="#8A93AD" tick={{ fill: "#8A93AD" }} />
                <YAxis type="number" dataKey="vina_score" name="Vina Score" reversed stroke="#8A93AD" tick={{ fill: "#8A93AD" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Compounds" data={chartData}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getSafetyColor(entry.safety_class)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Ranking Formula Explainer</h2>
          <div className="bg-black/40 p-4 rounded-lg mb-4 font-mono text-sm text-[#22E3D0]">
            {data.meta.ranking_formula}
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[#8A93AD]">Vina Score Weight</span>
              <span className="text-white font-mono">{data.meta.weights.vina.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8A93AD]">Safety Weight</span>
              <span className="text-white font-mono">{data.meta.weights.safety.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8A93AD]">Drug-likeness Weight</span>
              <span className="text-white font-mono">{data.meta.weights.druglike.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-xs text-[#8A93AD] border-l-2 border-[#5B8CFF] pl-3 py-1">
            Note: The published ranking uses these fixed weights as per the final computational pipeline run.
          </p>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Limitations</h2>
          <ul className="list-disc list-inside space-y-2 text-[#8A93AD] text-sm leading-relaxed">
            <li>Docking uses zero-charge Gasteiger approximation for receptor; Vina scores carry ~1-2 kcal/mol uncertainty.</li>
            <li>Cu2+ coordination not modeled by standard Vina force field (metalloprotein docking limitation).</li>
            <li>No MD simulation performed — binding poses not equilibrated.</li>
            <li>Boltz-2 binding prediction not run (no weights on disk) — Vina is sole binding metric.</li>
            <li>All results are computational predictions — no in vitro/in vivo validation performed.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
