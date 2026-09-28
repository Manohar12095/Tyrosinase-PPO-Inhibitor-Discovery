"""
Stage 4 - Safety & Feasibility
================================
Team: CTRL+CELL | Tyrosinase/PPO Inhibitor Discovery Platform

Actions:
  1. For each candidate, evaluates Lipinski Rule of Five (from Stage 2 descriptors)
  2. Flags known toxicophores using RDKit SMARTS patterns (PAINS, reactive groups)
  3. Generates a SMILES batch file ready for SwissADME and ProTox 3.0 manual submission
  4. Writes a retrosynthesis sketch for the top-ranked candidate
  5. Output: outputs/safety_report.json, outputs/swissadme_batch.smi

Note on web tools:
  SwissADME (swissadme.ch) and ProTox 3.0 (tox.charite.de/protox3) do NOT offer
  a public bulk API. This script generates the batch SMILES file for manual submission.
  Toxicity class values in the final dossier are taken directly from those tool outputs;
  this script DOES NOT fabricate any toxicity numbers.

Run: python stage4_safety/screen_safety.py
"""

import json, sys, re
from pathlib import Path

try:
    from rdkit import Chem
    from rdkit.Chem import FilterCatalog, Descriptors, rdMolDescriptors
    from rdkit.Chem.FilterCatalog import FilterCatalogParams
    import pandas as pd
except ImportError:
    sys.exit("[ERROR] rdkit/pandas missing.")

ROOT        = Path(__file__).parent.parent
OUT_DIR     = ROOT / "outputs"
CAND_CSV    = OUT_DIR / "candidates.csv"
DOCK_JSON   = OUT_DIR / "docking_results.json"
SAFETY_JSON = OUT_DIR / "safety_report.json"
SMILES_FILE = OUT_DIR / "swissadme_batch.smi"

# ---- PAINS filter catalog ----
params = FilterCatalogParams()
params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
pains_catalog = FilterCatalog.FilterCatalog(params)

# ---- Additional toxicophore SMARTS ----
TOXICOPHORES = {
    "Nitro_group":       "[N+](=O)[O-]",
    "Michael_acceptor":  "C=CC(=O)[!N]",
    "Aldehyde":          "[CX3H1](=O)",
    "Epoxide":           "C1OC1",
    "Acyl_halide":       "C(=O)[F,Cl,Br,I]",
    "Quinone":           "O=C1C=CC(=O)C=C1",
    "ArylAmine":         "c[NH2]",
    "Hydrazine":         "[NX3][NX3]",
    "Peroxide":          "OO",
    "Thiocarbonyl":      "C=S",
    "Imine":             "[NX2]=C",
    "Heavy_metal_chelate": "[#6][SD1]",
}
tox_patterns = {name: Chem.MolFromSmarts(smarts) for name, smarts in TOXICOPHORES.items()}

def screen_molecule(smiles, cand_id, name, mw, logP, hbd, hba, tpsa, rot, lip_violations):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return {"id": cand_id, "name": name, "smiles": smiles, "status": "INVALID_SMILES"}

    # Lipinski evaluation
    lipinski = {
        "MW_ok":  mw <= 500,
        "logP_ok": logP <= 5,
        "HBD_ok": hbd <= 5,
        "HBA_ok": hba <= 10,
        "violations": lip_violations,
        "pass": lip_violations == 0,
    }

    # Veber drug-likeness (oral bioavailability proxy)
    veber_ok = (rot <= 10 and tpsa <= 140)

    # PAINS check
    pains_matches = []
    entry = pains_catalog.GetFirstMatch(mol)
    if entry:
        pains_matches.append(entry.GetDescription())

    # Toxicophore flags
    tox_flags = []
    for tname, patt in tox_patterns.items():
        if patt and mol.HasSubstructMatch(patt):
            tox_flags.append(tname)

    # Cosmetic/food-grade considerations
    # Hydroquinone: banned in EU cosmetics at concentrations >1% (Directive 76/768/EEC amended)
    # Arbutin: allowed, hydroquinone prodrug concern at high doses
    cosmetic_notes = []
    if cand_id in ("REF003", "HQ002"):
        cosmetic_notes.append("Hydroquinone/catechol: EU cosmetics directive restricts >1% concentration")
    if cand_id == "REF002":
        cosmetic_notes.append("Arbutin: allowed in EU cosmetics; slow hydrolysis to hydroquinone flagged")
    if "Nitro_group" in tox_flags:
        cosmetic_notes.append("Nitro aromatic: potential mutagenicity risk (Ames test concern)")

    # Overall safety assessment
    serious_flags = [f for f in tox_flags if f in ("Nitro_group", "Epoxide", "Acyl_halide", "Hydrazine", "Peroxide")]
    safety_class = "LOW_CONCERN"
    if serious_flags or pains_matches:
        safety_class = "MODERATE_CONCERN"
    if len(serious_flags) >= 2:
        safety_class = "HIGH_CONCERN"

    return {
        "id": cand_id,
        "name": name,
        "smiles": smiles,
        "lipinski": lipinski,
        "veber_oral_bioavailability": veber_ok,
        "MW": mw, "logP": logP, "HBD": hbd, "HBA": hba, "TPSA": tpsa, "RotBonds": rot,
        "pains_flags": pains_matches,
        "toxicophore_flags": tox_flags,
        "cosmetic_regulatory_notes": cosmetic_notes,
        "computed_safety_class": safety_class,
        "protox3_class": "MANUAL_SUBMISSION_REQUIRED",
        "swissadme_status": "MANUAL_SUBMISSION_REQUIRED",
        "status": "screened",
    }

def main():
    df = pd.read_csv(CAND_CSV)
    results = []
    for _, row in df.iterrows():
        r = screen_molecule(
            row["smiles"], row["id"], row["name"],
            row["MW"], row["logP"], row["HBD"], row["HBA"],
            row["TPSA"], row["RotBonds"], row["Lipinski_violations"]
        )
        results.append(r)
        flag_str = ", ".join(r.get("toxicophore_flags",[]) + r.get("pains_flags",[]))
        lip_str = f"LipViol={r['lipinski']['violations']}" if r.get("lipinski") else "INVALID"
        print(f"  {row['id']:8s}  {row['name']:<38s}  {r.get('computed_safety_class','N/A'):<16s}  {lip_str}  flags=[{flag_str}]")

    with open(SAFETY_JSON, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[Stage 4] Safety report -> {SAFETY_JSON}")

    # Generate SwissADME / ProTox 3.0 batch file
    with open(SMILES_FILE, "w") as f:
        f.write("# SMILES batch for SwissADME (swissadme.ch) and ProTox 3.0 (tox.charite.de/protox3)\n")
        f.write("# Paste these SMILES into the respective web tool input boxes\n")
        f.write("# ---- SwissADME: supports newline-separated SMILES in batch mode ----\n")
        f.write("# ---- ProTox 3.0: paste one SMILES per line in the input box ----\n\n")
        for r in results:
            if r.get("smiles") and r.get("status") != "INVALID_SMILES":
                f.write(f"{r['smiles']} {r['id']} {r['name'].replace(' ','_')}\n")
    print(f"[Stage 4] Batch SMILES -> {SMILES_FILE}")
    print("\n  *** MANUAL STEP REQUIRED ***")
    print("  1. Go to https://swissadme.ch -> paste contents of swissadme_batch.smi")
    print("     (use the SMILES column only, not the name; one per line)")
    print("  2. Go to https://tox.charite.de/protox3 -> paste each SMILES individually")
    print("     Record: Predicted Toxicity Class (I-VI), LD50, and organ toxicity predictions")
    print("  3. Update outputs/safety_report.json: set 'protox3_class' and 'swissadme_status'")
    print("     for each candidate based on the tool output.")
    print("  NO NUMBERS WILL BE FABRICATED — only tool-confirmed values enter the dossier.\n")

    # Retrosynthesis sketch for top candidate (based on docking; placeholder until docking done)
    retro = {
        "candidate": "NOV001 (Oxyresveratrol) -- pending docking rank confirmation",
        "note": "Retrosynthesis below is reasoned from known literature pathways. If docking ranks a different candidate #1, update accordingly.",
        "smiles": "Oc1ccc(/C=C/c2cc(O)cc(O)c2)cc1O",
        "iupac": "(E)-2-(4-hydroxystyryl)benzene-1,3,5-triol (Oxyresveratrol)",
        "steps": [
            {
                "step": 1,
                "description": "Wittig olefination",
                "reaction": "3,5-Dihydroxybenzaldehyde + (4-hydroxybenzyl)triphenylphosphonium salt -> Oxyresveratrol",
                "conditions": "NaH, THF, 0°C to RT, 12h",
                "starting_materials": ["3,5-Dihydroxybenzaldehyde (CAS 26153-38-8, commercial)", "4-Hydroxybenzyl bromide (CAS 2746-25-0, commercial)"],
                "notes": "Alternative: Heck coupling (pd-cat) from 4-iodophenol + 3,5-dihydroxystyrene"
            },
            {
                "step": 2,
                "description": "Alternative route: Stilbene synthesis via Knoevenagel condensation",
                "reaction": "3,5-Dihydroxybenzaldehyde + 4-hydroxyphenylacetic acid -> (via decarboxylation) Oxyresveratrol",
                "conditions": "Pyridine, piperidine, 100°C, 4h then decarboxylation 150°C",
                "starting_materials": ["3,5-Dihydroxybenzaldehyde", "4-Hydroxyphenylacetic acid (CAS 156-38-7, commercial, ~$10/g)"],
                "notes": "Requires E/Z selectivity control; photoisomerization gives E-isomer"
            }
        ],
        "literature_precedent": "Synthesis reviewed in Shen et al. Nat. Prod. Rep. 2009; Oxyresveratrol also isolated from Artocarpus lakoocha heartwood (Zhong et al. 2019, doi:10.3390/molecules24030548)"
    }
    retro_path = OUT_DIR / "retrosynthesis.json"
    with open(retro_path, "w") as f:
        json.dump(retro, f, indent=2)
    print(f"[Stage 4] Retrosynthesis sketch -> {retro_path}")
    print("[Stage 4] Complete.")
    return results

if __name__ == "__main__":
    main()
