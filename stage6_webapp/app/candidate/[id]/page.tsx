"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";

interface DockingResult {
  id: string; name: string; smiles: string;
  vina_score_kcal_mol: number | null; status: string;
  all_pose_scores?: number[];
  top_interacting_residues?: { chain: string; seq: number; name: string; min_dist_A: number }[];
  prep_method?: string;
}
interface SafetyRecord {
  id: string; name: string; smiles: string;
  lipinski?: { violations: number; pass: boolean; MW_ok: boolean; logP_ok: boolean; HBD_ok: boolean; HBA_ok: boolean };
  veber_oral_bioavailability?: boolean;
  computed_safety_class?: string;
  toxicophore_flags?: string[];
  pains_flags?: string[];
  cosmetic_regulatory_notes?: string[];
  MW?: number; logP?: number; HBD?: number; HBA?: number; TPSA?: number; RotBonds?: number;
}
interface RankedEntry {
  rank: number; id: string; name: string;
  vina_score: number; safety: string;
  composite: number; MW: number; logP: number;
}

const COLORS = { green: "#5E8B7E", amber: "#B5793B", clay: "#A6543A" };

function scoreColor(s: number) {
  return s <= -6.5 ? COLORS.green : s <= -5.8 ? COLORS.amber : COLORS.clay;
}

export default function CandidatePage() {
  const params = useParams();
  const id = params?.id as string;

  const [dock, setDock] = useState<DockingResult | null>(null);
  const [safe, setSafe] = useState<SafetyRecord | null>(null);
  const [rank, setRank] = useState<RankedEntry | null>(null);
  const [allRanked, setAllRanked] = useState<RankedEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [viewerReady, setViewerReady] = useState(false);
  const [viewerLoaded, setViewerLoaded] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/data/docking_results.json").then(r => r.json()),
      fetch("/data/safety_report.json").then(r => r.json()),
      fetch("/data/dossier.json").then(r => r.json()),
    ]).then(([dockData, safeData, dossier]) => {
      setDock(dockData.find((d: DockingResult) => d.id === id) ?? null);
      setSafe(safeData.find((s: SafetyRecord) => s.id === id) ?? null);
      const ranked: RankedEntry[] = dossier.section_6_recommendation.full_ranked_table;
      setAllRanked(ranked);
      setRank(ranked.find(r => r.id === id) ?? null);
      setLoaded(true);
    });
  }, [id]);

  // Poll until $3Dmol available
  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).$3Dmol) { setViewerReady(true); clearInterval(t); }
      if (++tries > 100) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, []);

  // Init viewer once data + engine ready
  useEffect(() => {
    if (!viewerReady || !loaded || !dock || !viewerRef.current || viewerLoaded) return;
    setViewerLoaded(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $3Dmol = (window as any).$3Dmol;
    const viewer = $3Dmol.createViewer(viewerRef.current, { backgroundColor: "#0e0d0a" });

    Promise.all([
      fetch("/data/structures/receptor.pdbqt").then(r => r.text()),
      fetch(`/data/structures/${id}_pose.pdbqt`).then(r => r.text()),
    ]).then(([receptor, ligand]) => {
      viewer.addModel(receptor, "pdbqt");
      viewer.setStyle({ model: 0 }, { cartoon: { color: "#EDE6D9", opacity: 0.55 } });

      viewer.addModel(ligand, "pdbqt");
      viewer.setStyle({ model: 1 }, { stick: { colorscheme: "greenCarbon", radius: 0.25 } });
      viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.3, color: COLORS.green }, { model: 1 });

      viewer.zoomTo({ model: 1 });
      viewer.render();
    }).catch(e => console.warn("3Dmol error:", e));
  }, [viewerReady, loaded, dock, id, viewerLoaded]);

  if (!loaded) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <p className="mono" style={{ color: "var(--fg-dim)" }}>Loading…</p>
      </div>
    );
  }
  if (!dock) {
    return (
      <div className="container" style={{ paddingTop: 80 }}>
        <p>Candidate not found. <Link href="/" className="view-link">Back</Link></p>
      </div>
    );
  }

  const safeClass = safe?.computed_safety_class ?? "UNKNOWN";
  const safeCol = safeClass === "LOW_CONCERN" ? COLORS.green : safeClass === "MODERATE_CONCERN" ? COLORS.amber : COLORS.clay;
  const poseData = dock.all_pose_scores?.map((s, i) => ({ pose: `P${i + 1}`, val: Math.abs(s), raw: s })) ?? [];

  const prevRank = allRanked.find(r => r.rank === (rank?.rank ?? 0) - 1);
  const nextRank = allRanked.find(r => r.rank === (rank?.rank ?? 0) + 1);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/">All candidates</Link>
        <span style={{ margin: "0 8px", color: "var(--rule)" }}>/</span>
        <span className="mono">{id}</span>
        {rank && <span style={{ marginLeft: 12, color: "var(--fg-dim)" }}>Rank #{rank.rank}</span>}
      </div>

      {/* Header */}
      <h1 style={{ marginBottom: 8 }}>{dock.name}</h1>
      <p className="mono" style={{ fontSize: "0.75rem", color: "var(--fg-dim)", marginBottom: 0, maxWidth: "100%", wordBreak: "break-all" }}>
        {id} — {dock.smiles}
      </p>

      {/* Main grid: viewer + props */}
      <div className="detail-grid">
        {/* Left: 3D viewer */}
        <div>
          <h3>Docked pose in 2Y9X</h3>
          <div ref={viewerRef} className="detail-viewer">
            {!viewerLoaded && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--fg-dim)", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                {viewerReady ? "Rendering…" : "Loading 3D engine…"}
              </div>
            )}
          </div>
          {/* Pose score chart */}
          {poseData.length > 0 && (
            <div style={{ marginTop: 24, height: 120 }}>
              <p className="mono" style={{ fontSize: "0.7rem", color: "var(--fg-dim)", marginBottom: 8, maxWidth: "100%" }}>
                Pose scores ({poseData.length} poses)
              </p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={poseData}>
                  <XAxis dataKey="pose" tick={{ fill: "var(--fg-dim)", fontSize: 9, fontFamily: "Consolas, monospace" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[4, 8]} hide />
                  <Tooltip
                    contentStyle={{ background: "#14110D", border: "1px solid rgba(181,121,59,0.3)", color: "#EDE6D9", fontFamily: "Consolas", fontSize: 11 }}
                    formatter={(_: unknown, __: unknown, p: { payload?: { raw?: number } }) => [`${(p.payload?.raw ?? 0).toFixed(3)} kcal/mol`, "score"]}
                    cursor={{ fill: "rgba(181,121,59,0.05)" }}
                  />
                  <Bar dataKey="val">
                    {poseData.map((_, i) => <Cell key={i} fill={i === 0 ? COLORS.green : COLORS.amber} fillOpacity={i === 0 ? 1 : 0.35} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Data panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {/* Binding */}
          <div>
            <h3>Binding Assessment</h3>
            <div className="prop-row">
              <span className="prop-label">Vina best pose</span>
              <span className="prop-value" style={{ color: dock.vina_score_kcal_mol ? scoreColor(dock.vina_score_kcal_mol) : COLORS.clay, fontWeight: "bold" }}>
                {dock.vina_score_kcal_mol?.toFixed(3) ?? "FAILED"} kcal/mol
              </span>
            </div>
            {rank && (
              <div className="prop-row">
                <span className="prop-label">Composite score</span>
                <span className="prop-value">{rank.composite.toFixed(4)}</span>
              </div>
            )}
            {dock.top_interacting_residues?.slice(0, 4).map((r, i) => (
              <div className="prop-row" key={i}>
                <span className="prop-label">Contact {i + 1} — {r.name}{r.seq}</span>
                <span className="prop-value" style={{ color: COLORS.green }}>{r.min_dist_A} Å</span>
              </div>
            ))}
          </div>

          {/* Physicochemical */}
          <div>
            <h3>Physicochemical</h3>
            {[
              ["MW", safe?.MW?.toFixed(1), "Da"],
              ["logP", safe?.logP?.toFixed(3), ""],
              ["HBD", String(safe?.HBD ?? "—"), ""],
              ["HBA", String(safe?.HBA ?? "—"), ""],
              ["TPSA", safe?.TPSA?.toFixed(1), "Å²"],
              ["RotBonds", String(safe?.RotBonds ?? "—"), ""],
            ].map(([k, v, u]) => (
              <div className="prop-row" key={k}>
                <span className="prop-label">{k}</span>
                <span className="prop-value">{v ?? "—"} {u}</span>
              </div>
            ))}
            <div className="prop-row">
              <span className="prop-label">Lipinski Ro5</span>
              <span className="prop-value" style={{ color: safe?.lipinski?.pass ? COLORS.green : COLORS.clay }}>
                {safe?.lipinski?.pass ? "Pass" : `Fail (${safe?.lipinski?.violations} violation${safe?.lipinski?.violations === 1 ? "" : "s"})`}
              </span>
            </div>
          </div>

          {/* Safety */}
          <div>
            <h3>Safety Screening</h3>
            <div className="prop-row">
              <span className="prop-label">Class</span>
              <span className="prop-value" style={{ color: safeCol, fontWeight: "bold" }}>
                {safeClass.replace("_CONCERN", "")}
              </span>
            </div>
            {(safe?.toxicophore_flags?.length ?? 0) > 0 && (
              <div className="prop-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 4 }}>
                <span className="prop-label">Toxicophores</span>
                <span className="mono" style={{ fontSize: "0.75rem", color: COLORS.amber }}>{safe!.toxicophore_flags!.join(", ")}</span>
              </div>
            )}
            {(safe?.pains_flags?.length ?? 0) > 0 && (
              <div className="prop-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 4 }}>
                <span className="prop-label">PAINS</span>
                <span className="mono" style={{ fontSize: "0.75rem", color: COLORS.clay }}>{safe!.pains_flags!.join(", ")}</span>
              </div>
            )}
            {!safe?.toxicophore_flags?.length && !safe?.pains_flags?.length && (
              <div className="prop-row">
                <span className="prop-label">Flags</span>
                <span className="mono" style={{ fontSize: "0.75rem", color: COLORS.green }}>None detected</span>
              </div>
            )}
            {(safe?.cosmetic_regulatory_notes?.length ?? 0) > 0 && (
              <div style={{ marginTop: 12 }}>
                {safe!.cosmetic_regulatory_notes!.map((n, i) => (
                  <p key={i} className="mono" style={{ fontSize: "0.72rem", color: COLORS.amber, maxWidth: "100%", marginBottom: 4 }}>⚑ {n}</p>
                ))}
              </div>
            )}
            <p className="mono" style={{ fontSize: "0.68rem", color: "var(--fg-dim)", marginTop: 16, maxWidth: "100%" }}>
              ProTox 3.0 and SwissADME values require manual web submission. See outputs/swissadme_batch.smi
            </p>
          </div>
        </div>
      </div>

      {/* Prev / Next navigation */}
      <div style={{ display: "flex", gap: 24, marginTop: 64, borderTop: "1px solid var(--rule)", paddingTop: 32 }}>
        {prevRank ? (
          <Link href={`/candidate/${prevRank.id}`} style={{ flex: 1, textDecoration: "none", borderRight: "1px solid var(--rule)", paddingRight: 24 }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--fg-dim)", display: "block" }}>← Rank #{prevRank.rank}</span>
            <span style={{ fontWeight: "bold", color: "var(--fg)", display: "block", marginTop: 4 }}>{prevRank.name}</span>
            <span className="mono" style={{ fontSize: "0.75rem", color: scoreColor(prevRank.vina_score) }}>{prevRank.vina_score.toFixed(3)} kcal/mol</span>
          </Link>
        ) : <div style={{ flex: 1 }} />}
        {nextRank ? (
          <Link href={`/candidate/${nextRank.id}`} style={{ flex: 1, textDecoration: "none", textAlign: "right" }}>
            <span className="mono" style={{ fontSize: "0.68rem", color: "var(--fg-dim)", display: "block" }}>Rank #{nextRank.rank} →</span>
            <span style={{ fontWeight: "bold", color: "var(--fg)", display: "block", marginTop: 4 }}>{nextRank.name}</span>
            <span className="mono" style={{ fontSize: "0.75rem", color: scoreColor(nextRank.vina_score) }}>{nextRank.vina_score.toFixed(3)} kcal/mol</span>
          </Link>
        ) : <div style={{ flex: 1 }} />}
      </div>
    </div>
  );
}
