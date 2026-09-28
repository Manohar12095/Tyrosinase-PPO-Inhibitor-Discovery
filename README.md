# Tyrosinase/PPO Inhibitor Discovery Platform
## Team CTRL+CELL — Hackathon 2026

> **"Stopping the Browning"** — Computational discovery of tyrosinase inhibitors
> for food anti-browning and cosmetic skin-lightening applications.

---

## Quick Start

### Prerequisites
- Python 3.12 (with pip)
- Node.js 18+ (for the web app)
- Windows 10/11 (scripts use PowerShell paths; adapt for Linux/Mac)

### 1. Set up Python environment

```powershell
# From project root (Hackathon_codex/)
python -m venv venv
.\venv\Scripts\python.exe -m pip install rdkit biopython pandas requests numpy meeko gemmi scipy matplotlib
```

### 2. Run the full pipeline

```powershell
# Stage 1 — Target characterization
.\venv\Scripts\python.exe stage1_target\analyze_active_site.py

# Stage 2 — Candidate generation
.\venv\Scripts\python.exe stage2_candidates\generate_candidates.py

# Stage 3 — Docking (requires Vina in tools\vina.exe)
# Download Vina 1.2.7 from https://github.com/ccsb-scripps/AutoDock-Vina/releases
# then run receptor prep and docking:
.\venv\Scripts\python.exe stage3_docking\fix_receptor.py
.\venv\Scripts\python.exe stage3_docking\run_docking.py

# Stage 4 — Safety screening
.\venv\Scripts\python.exe stage4_safety\screen_safety.py

# Stage 5 — Ranking & dossier
.\venv\Scripts\python.exe stage5_ranking\generate_dossier.py
```

### 3. Run the web app locally

```powershell
cd stage6_webapp
npm install
# Build results.json from outputs:
..\venv\Scripts\python.exe ..\pipeline\build_results.py
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# From stage6_webapp/ directory:
vercel --prod
```

---

## Project Structure

```
Hackathon_codex/
├── data/
│   ├── structures/         # 2Y9X.pdb, 2Y9W.pdb
│   └── inhibitors/         # BindingDB CSV
├── stage1_target/
│   └── analyze_active_site.py     # PDB parsing → active_site_report.json
├── stage2_candidates/
│   └── generate_candidates.py     # SMILES + RDKit → candidates.csv
├── stage3_docking/
│   ├── fix_receptor.py             # PDB→PDBQT conversion
│   ├── prep_receptor.py            # Receptor stripping
│   └── run_docking.py              # Vina docking → docking_results.json
├── stage4_safety/
│   └── screen_safety.py            # PAINS + toxicophores → safety_report.json
├── stage5_ranking/
│   └── generate_dossier.py         # Ranking + dossier → dossier.json + dossier.md
├── stage6_webapp/                  # Next.js 16 app (Vercel-deployable)
│   ├── app/
│   │   ├── page.tsx                # Landing page + charts + table
│   │   ├── candidate/[id]/page.tsx # Per-candidate detail
│   │   └── api/dossier/route.ts    # Dossier download API
│   └── public/data/                # Static JSON/CSV for the webapp
├── outputs/                        # All pipeline outputs
│   ├── active_site_report.json
│   ├── candidates.csv
│   ├── docking_results.json
│   ├── docking_poses/              # Per-compound PDBQT pose files
│   ├── safety_report.json
│   ├── retrosynthesis.json
│   ├── swissadme_batch.smi         # Paste into SwissADME / ProTox 3.0
│   ├── dossier.json
│   └── dossier.md
└── tools/
    └── vina.exe                    # AutoDock Vina v1.2.7
```

---

## Key Results

| Rank | Compound | Vina Score | Safety | Composite |
|------|----------|-----------|--------|-----------|
| 1 | **NOV005** — Hydroxamic acid-tropolone hybrid | **−6.913 kcal/mol** | LOW | **1.0000** |
| 2 | TL004 — Beta-Thujaplicin | −6.292 kcal/mol | LOW | 0.8459 |
| 3 | TL001 — 3-Methyltropolone | −6.241 kcal/mol | LOW | 0.8333 |
| 4 | TL002 — 3-Chlorotropolone | −6.195 kcal/mol | LOW | 0.8218 |
| 5 | HQ005 — 4-Chlororesorcinol | −5.908 kcal/mol | LOW | 0.7506 |

**Ranking formula:** `composite = 0.50 × vina_norm + 0.25 × safety_norm + 0.25 × druglike_norm`

---

## Manual Steps Required

1. **SwissADME:** paste `outputs/swissadme_batch.smi` at https://swissadme.ch
2. **ProTox 3.0:** submit each SMILES at https://tox.charite.de/protox3
3. **Boltz-2:** not run (no model weights); add weights to `models/` and rerun Stage 3 if available
4. **Ellagic acid (REF005):** excluded due to SMILES kekulization failure; resubmit with corrected SMILES

---

## Scientific Claims Traceability

Every number in `dossier.md` traces back to:
- A computed result in `outputs/` (run the pipeline to reproduce)
- A cited literature reference (DOI provided)

**No values were fabricated.**

---

*AutoDock Vina v1.2.7 (DOI: 10.1021/acs.jcim.1c00203) · RDKit · biopython · Target: PDB 2Y9X*
