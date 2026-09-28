"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dossierData from "../public/data/dossier.json";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

interface RankedEntry {
  rank: number; id: string; name: string;
  vina_score: number; safety: string;
  MW: number; logP: number; composite: number;
}

const COLORS = {
  green: "#5E8B7E",
  amber: "#B5793B",
  clay: "#A6543A",
};

function scoreColor(s: number) {
  if (s <= -6.5) return COLORS.green;
  if (s <= -5.8) return COLORS.amber;
  return COLORS.clay;
}
function safetyColor(s: string) {
  if (s === "LOW_CONCERN") return COLORS.green;
  if (s === "MODERATE_CONCERN") return COLORS.amber;
  return COLORS.clay;
}
function safetyChip(s: string) {
  if (s === "LOW_CONCERN") return { cls: "chip chip-green", label: "LOW" };
  if (s === "MODERATE_CONCERN") return { cls: "chip chip-amber", label: "MOD" };
  return { cls: "chip chip-clay", label: "HIGH" };
}

export default function Home() {
  const [ranked, setRanked] = useState<RankedEntry[]>(dossierData.section_6_recommendation.full_ranked_table);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof RankedEntry>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const topCandidate = dossierData.section_6_recommendation.top_candidate;
  const totalScreened = dossierData.section_2_design_rationale.total_candidates;
  const lowConcernCount = ranked.filter(r => r.safety === "LOW_CONCERN").length;

  // Poll until $3Dmol is available (it loads async from CDN)
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).$3Dmol) {
        setViewerReady(true);
        clearInterval(id);
      }
      if (++tries > 100) clearInterval(id); // give up after 10s
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Initialize viewer once $3Dmol is ready
  useEffect(() => {
    if (!viewerReady || !viewerRef.current || viewerLoaded) return;
    setViewerLoaded(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $3Dmol = (window as any).$3Dmol;
    const viewer = $3Dmol.createViewer(viewerRef.current, {
      backgroundColor: "#14110D",
    });

    Promise.all([
      fetch("/data/structures/receptor.pdbqt").then(r => r.text()),
      fetch(`/data/structures/${topCandidate.id}_pose.pdbqt`).then(r => r.text()),
    ]).then(([receptor, ligand]) => {
      viewer.addModel(receptor, "pdbqt");
      viewer.setStyle({ model: 0 }, { cartoon: { color: "#EDE6D9", opacity: 0.75 } });

      viewer.addModel(ligand, "pdbqt");
      viewer.setStyle({ model: 1 }, { stick: { colorscheme: "greenCarbon", radius: 0.25 } });
      viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.25, color: COLORS.green }, { model: 1 });

      viewer.zoomTo({ model: 1 });
      viewer.spin("y", 0.3);
      viewer.render();
    }).catch(e => console.warn("3Dmol load failed:", e));
  }, [viewerReady, viewerLoaded]);

  const handleSort = (key: keyof RankedEntry) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = ranked
    .filter(r =>
      !filter ||
      r.id.toLowerCase().includes(filter.toLowerCase()) ||
      r.name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const vA = a[sortKey], vB = b[sortKey];
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const top5 = [...ranked]
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 5);
  
  const references = ranked.filter(r => r.id.startsWith("REF"));
  // combine top5 and references, avoiding duplicates, then sort by composite
  const chartData = [...top5, ...references.filter(r => !top5.some(t => t.id === r.id))]
    .sort((a, b) => b.composite - a.composite);

  const TH = ({ k, label }: { k: keyof RankedEntry; label: string }) => (
    <th onClick={() => handleSort(k)} tabIndex={0}
      onKeyDown={e => e.key === "Enter" && handleSort(k)}>
      {label}{sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <>
      {/* ── HERO ─── */}
      <section className="hero-section">
        <div ref={viewerRef} className="hero-viewer" />

        {!viewerLoaded && (
          <div className="hero-viewer-fallback">
            {/* Placeholder DNA/molecule SVG background */}
            <svg width="600" height="400" viewBox="0 0 600 400" fill="none">
              {[...Array(6)].map((_, i) => (
                <circle key={i} cx={100 + i * 80} cy={200} r={30 + i * 4}
                  stroke="#5E8B7E" strokeWidth="0.5" />
              ))}
              {[...Array(5)].map((_, i) => (
                <line key={i} x1={130 + i * 80} y1={200} x2={180 + i * 80} y2={200}
                  stroke="#B5793B" strokeWidth="0.5" />
              ))}
            </svg>
          </div>
        )}

        <div className="hero-loading">
          {!viewerReady ? "Loading 3D engine…" : !viewerLoaded ? "Rendering…" : "2Y9X · Cu active site"}
        </div>

        <div className="hero-data">
          <span className="hero-badge">Rank 1</span>
          <span className="hero-badge">{topCandidate.id}</span>
          <h1>{dossierData.section_2_design_rationale.strategy}</h1>
          <span className="hero-score">{topCandidate.vina_score_kcal_mol < 0 ? '−' : ''}{Math.abs(topCandidate.vina_score_kcal_mol).toFixed(3)} kcal/mol</span>
          <span className="hero-score-label">Docked with AutoDock Vina v1.2.7 against target PDB 2Y9X to find the best pose binding affinity.</span>
        </div>
      </section>

      {/* ── STAT STRIP ─── */}
      <div className="stat-strip">
        {[
          { val: totalScreened.toString(), label: "compounds screened" },
          { val: (topCandidate.vina_score_kcal_mol < 0 ? '−' : '') + Math.abs(topCandidate.vina_score_kcal_mol).toFixed(3), label: "best Vina score (kcal/mol)" },
          { val: topCandidate.id, label: "top candidate" },
          { val: "PDB 2Y9X", label: "target structure" },
          { val: `${lowConcernCount} / ${totalScreened}`, label: "low-concern safety class" },
        ].map(s => (
          <div className="stat-item" key={s.label}>
            <span className="stat-value mono">{s.val}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="container">
        {/* ── TOP 5 & REF CHART ─── */}
        {chartData.length > 0 && (
          <section className="section">
            <span className="section-label">binding affinity — top candidates vs references</span>
            <h2>Validation Control</h2>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.map(c => ({ id: c.id, score: Math.abs(c.vina_score), raw: c.vina_score, isRef: c.id.startsWith('REF') }))}
                  layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(181,121,59,0.08)" />
                  <XAxis type="number" domain={[4, 8]} tick={{ fill: "#EDE6D9", fontSize: 10, fontFamily: "Consolas, monospace" }}
                    tickFormatter={v => `−${v}`} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="id" width={64}
                    tick={{ fill: "#EDE6D9", fontSize: 10, fontFamily: "Consolas, monospace" }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#14110D", border: "1px solid rgba(181,121,59,0.3)", color: "#EDE6D9", fontFamily: "Consolas, monospace", fontSize: 12 }}
                    formatter={(_: unknown, __: unknown, p: { payload?: { raw?: number } }) => [
                      `${(p.payload?.raw ?? 0).toFixed(3)} kcal/mol`, "Vina score"
                    ]}
                    cursor={{ fill: "rgba(181,121,59,0.05)" }}
                  />
                  <Bar dataKey="score" radius={[0, 2, 2, 0]}>
                    {chartData.map((c, i) => (
                      <Cell key={i} fill={scoreColor(c.vina_score)} fillOpacity={i === 0 ? 1 : (c.id.startsWith("REF") ? 0.3 : 0.65)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* ── RESULTS TABLE ─── */}
        <section className="section">
          <span className="section-label">complete screening results</span>
          <h2>All {ranked.length} Compounds</h2>

          <div className="table-toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Search by ID or name…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <span className="table-count">
              {filtered.length}/{ranked.length} shown
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="results-table">
              <thead>
                <tr>
                  <TH k="rank" label="Rank" />
                  <TH k="id" label="ID" />
                  <TH k="name" label="Name" />
                  <TH k="vina_score" label="Vina (kcal/mol)" />
                  <TH k="safety" label="Safety" />
                  <TH k="MW" label="MW (Da)" />
                  <TH k="logP" label="logP" />
                  <TH k="composite" label="Composite" />
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const chip = safetyChip(r.safety);
                  return (
                    <tr key={r.id}>
                      <td className="rank-cell">{r.rank}</td>
                      <td className="id-cell" style={{ color: "#EDE6D9" }}>{r.id}</td>
                      <td className="name-cell" style={{ fontSize: "0.82rem" }}>{r.name}</td>
                      <td className="score-cell" style={{ color: scoreColor(r.vina_score) }}>
                        {r.vina_score.toFixed(3)}
                      </td>
                      <td><span className={chip.cls}>{chip.label}</span></td>
                      <td className="num-cell">{r.MW.toFixed(1)}</td>
                      <td className="num-cell">{r.logP.toFixed(2)}</td>
                      <td className="num-cell">{r.composite.toFixed(4)}</td>
                      <td>
                        <Link href={`/candidate/${r.id}`} className="view-link">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
