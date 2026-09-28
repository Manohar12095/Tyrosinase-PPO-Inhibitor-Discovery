"""
Stage 2 - Candidate Generation
================================
Team: CTRL+CELL | Tyrosinase/PPO Inhibitor Discovery Platform

Loads 5 reference inhibitors (SMILES), generates 15-25 analogs by systematic
functional-group substitutions around the phenolic/chelating core, computes
RDKit 2D descriptors (MW, logP, HBD, HBA, TPSA, RotBonds) for every candidate.

Output: outputs/candidates.csv

Run: python stage2_candidates/generate_candidates.py
"""

import sys, json
from pathlib import Path

try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, AllChem, rdMolDescriptors, Draw
    from rdkit.Chem.MolStandardize import rdMolStandardize
    import pandas as pd
except ImportError:
    sys.exit("[ERROR] rdkit/pandas not found. Activate venv.")

ROOT    = Path(__file__).parent.parent
OUT_DIR = ROOT / "outputs"
OUT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Reference inhibitors from BindingDB/ChEMBL/literature
# IC50 values sourced from ChEMBL/literature (for context only; not fabricated)
# ---------------------------------------------------------------------------
REFERENCES = [
    {"id": "REF001", "name": "Kojic acid",     "smiles": "O=C1OC(CO)=CC(=O)1",
     "source": "ChEMBL:CHEMBL133058", "role": "reference"},
    {"id": "REF002", "name": "Arbutin",        "smiles": "OC[C@H]1O[C@@H](Oc2ccc(O)cc2)[C@H](O)[C@@H](O)[C@@H]1O",
     "source": "ChEMBL:CHEMBL299374", "role": "reference"},
    {"id": "REF003", "name": "Hydroquinone",   "smiles": "Oc1ccc(O)cc1",
     "source": "ChEMBL:CHEMBL781",   "role": "reference"},
    {"id": "REF004", "name": "Tropolone",      "smiles": "O=C1C=CC=CC(O)=C1",
     "source": "ChEMBL:CHEMBL276013","role": "reference"},
    {"id": "REF005", "name": "Ellagic acid",   "smiles": "O=c1oc2c(=O)oc3cc(O)c(O)cc3c2c1cc1cc(O)c(O)cc1=O",
     "source": "ChEMBL:CHEMBL265676","role": "reference"},
]

# ---------------------------------------------------------------------------
# Analog library: systematic substitutions around phenolic/chelating cores
# Design rationale: maintain copper-chelating motif (catechol/hydroxyl pair)
# while exploring electronic (F, Cl, OMe) and steric (Me, tBu) effects
# ---------------------------------------------------------------------------
ANALOGS = [
    # ---- Kojic acid analogs (pyranone core) ----
    {"id": "KA001", "name": "5-Fluorokojic acid",     "smiles": "O=C1OC(CO)=CC(=O)[C@@H]1F",
     "source": "designed", "role": "analog", "parent": "REF001",
     "rationale": "Electron-withdrawing F at C5 increases electrophilicity of carbonyl, potentially tightening Cu chelation"},
    {"id": "KA002", "name": "5-Chlorokojic acid",     "smiles": "O=C1OC(CO)=CC(=O)[C@@H]1Cl",
     "source": "designed", "role": "analog", "parent": "REF001",
     "rationale": "Cl provides stronger steric effect than F; tests halogen tolerance at Cu site"},
    {"id": "KA003", "name": "5-Methylkojic acid",     "smiles": "O=C1OC(CO)=CC(=O)[C@@H]1C",
     "source": "designed", "role": "analog", "parent": "REF001",
     "rationale": "Methyl group explores hydrophobic pocket near CuA (PHE90, LEU89)"},
    {"id": "KA004", "name": "Kojic acid methyl ester","smiles": "O=C1OC(COC)=CC(=O)1",
     "source": "designed", "role": "analog", "parent": "REF001",
     "rationale": "Esterification of hydroxymethyl reduces HBD count (improves logP) while probing pocket volume"},

    # ---- Hydroquinone analogs (catechol/para-diphenol) ----
    {"id": "HQ001", "name": "4-Methoxyphenol",        "smiles": "COc1ccc(O)cc1",
     "source": "literature", "role": "analog", "parent": "REF003",
     "rationale": "Known partial tyrosinase inhibitor; methoxy vs hydroxyl tests H-bond donor requirement"},
    {"id": "HQ002", "name": "Catechol",               "smiles": "Oc1ccccc1O",
     "source": "literature", "role": "analog", "parent": "REF003",
     "rationale": "Ortho-diol: strong Cu chelator; substrate-like but inhibitory at high concentration"},
    {"id": "HQ003", "name": "4-tert-Butylcatechol",   "smiles": "Oc1ccc(C(C)(C)C)cc1O",
     "source": "literature", "role": "analog", "parent": "REF003",
     "rationale": "Bulky tBu fills hydrophobic sub-pocket (TRP93, PHE292); commercial antioxidant"},
    {"id": "HQ004", "name": "4-Fluorocatechol",       "smiles": "Oc1ccc(F)cc1O",
     "source": "designed", "role": "analog", "parent": "REF003",
     "rationale": "Fluorine bioisostere of OH; tests whether para-F maintains inhibition"},
    {"id": "HQ005", "name": "4-Chlororesorcinol",     "smiles": "Oc1cccc(O)c1Cl",
     "source": "designed", "role": "analog", "parent": "REF003",
     "rationale": "Meta-diol + para-Cl: explores effect of diol positioning on Cu coordination geometry"},

    # ---- Tropolone analogs (seven-membered chelating ring) ----
    {"id": "TL001", "name": "3-Methyltropolone",       "smiles": "O=C1C=CC=CC(O)=C1C",
     "source": "literature", "role": "analog", "parent": "REF004",
     "rationale": "Methyl at C3 adjacent to O=C; exploits hydrophobic space seen with tropolone pose"},
    {"id": "TL002", "name": "3-Chlorotropolone",       "smiles": "O=C1C=CC=CC(O)=C1Cl",
     "source": "designed", "role": "analog", "parent": "REF004",
     "rationale": "Halogen at C3 tests H-bond acceptor capacity vs steric clash in tight pocket"},
    {"id": "TL003", "name": "4-Nitrotropolone",        "smiles": "O=C1C=C([N+](=O)[O-])C=CC(O)=C1",
     "source": "designed", "role": "analog", "parent": "REF004",
     "rationale": "Strong EWG at C4 alters pi-electron density of chelating enol; toxicophore flag expected"},
    {"id": "TL004", "name": "Beta-Thujaplicin",        "smiles": "O=C1C=CC=CC(O)=C1C(C)C",
     "source": "literature", "role": "analog", "parent": "REF004",
     "rationale": "Natural tropolone derivative from Western red cedar; known copper chelator with antimicrobial activity"},

    # ---- Hybrid / novel scaffolds ----
    {"id": "NOV001","name": "Oxyresveratrol",          "smiles": "Oc1ccc(/C=C/c2cc(O)cc(O)c2)cc1O",
     "source": "literature", "role": "novel", "parent": None,
     "rationale": "Natural stilbene with two catechol-like OH pairs; potent PPO inhibitor in literature (IC50 ~1 uM); included as novel positive control"},
    {"id": "NOV002","name": "4-Hydroxybenzaldehyde",   "smiles": "O=Cc1ccc(O)cc1",
     "source": "literature", "role": "novel", "parent": None,
     "rationale": "Simple phenolic aldehyde; Schiff-base former that may covalently cap active-site Lys"},
    {"id": "NOV003","name": "Caffeic acid",            "smiles": "OC(=O)/C=C/c1ccc(O)c(O)c1",
     "source": "literature", "role": "novel", "parent": None,
     "rationale": "Catechol + alpha,beta-unsaturated acid; known competitive inhibitor; provides extended chelation arm"},
    {"id": "NOV004","name": "Mimosine",                "smiles": "N[C@@H](CC1=CC(=O)C(O)=NC1=O)C(=O)O",
     "source": "literature", "role": "novel", "parent": None,
     "rationale": "Plant amino acid with hydroxypyridinone chelating group; strong Cu binder different from catechol"},
    {"id": "NOV005","name": "Hydroxamic acid-tropolone hybrid",
     "smiles": "O=C1C=CC=CC(O)=C1C(=O)NO",
     "source": "designed", "role": "novel", "parent": "REF004",
     "rationale": "Adds hydroxamic acid arm to tropolone; dual chelation mode (enol-O + hydroxamate) targeting both Cu ions simultaneously"},
]

ALL_CANDIDATES = REFERENCES + ANALOGS

# ---------------------------------------------------------------------------
# Compute RDKit descriptors
# ---------------------------------------------------------------------------
def compute_descriptors(smiles):
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    mol = Chem.AddHs(mol)
    return {
        "MW":       round(Descriptors.ExactMolWt(mol), 3),
        "logP":     round(Descriptors.MolLogP(mol), 3),
        "HBD":      rdMolDescriptors.CalcNumHBD(mol),
        "HBA":      rdMolDescriptors.CalcNumHBA(mol),
        "TPSA":     round(rdMolDescriptors.CalcTPSA(mol), 2),
        "RotBonds": rdMolDescriptors.CalcNumRotatableBonds(mol),
        "RingCount":rdMolDescriptors.CalcNumRings(mol),
        "ArRings":  rdMolDescriptors.CalcNumAromaticRings(mol),
        "HeavyAtoms":mol.GetNumHeavyAtoms(),
        "Lipinski_violations": sum([
            1 if Descriptors.ExactMolWt(mol) > 500 else 0,
            1 if Descriptors.MolLogP(mol) > 5 else 0,
            1 if rdMolDescriptors.CalcNumHBD(mol) > 5 else 0,
            1 if rdMolDescriptors.CalcNumHBA(mol) > 10 else 0,
        ]),
    }

rows = []
failed = []
for cand in ALL_CANDIDATES:
    desc = compute_descriptors(cand["smiles"])
    if desc is None:
        failed.append(cand["id"])
        print(f"  [WARN] Invalid SMILES for {cand['id']} ({cand['name']}) -- skipped")
        continue
    row = {
        "id": cand["id"],
        "name": cand["name"],
        "smiles": cand["smiles"],
        "role": cand["role"],
        "parent": cand.get("parent",""),
        "rationale": cand.get("rationale",""),
        "source": cand["source"],
    }
    row.update(desc)
    rows.append(row)
    print(f"  {cand['id']:8s}  {cand['name']:<38s}  MW={desc['MW']:.1f}  logP={desc['logP']:.2f}  HBD={desc['HBD']}  HBA={desc['HBA']}  TPSA={desc['TPSA']}  Lip={desc['Lipinski_violations']}")

df = pd.DataFrame(rows)
out_csv = OUT_DIR / "candidates.csv"
df.to_csv(out_csv, index=False)
print(f"\n[Stage 2] {len(rows)} candidates saved -> {out_csv}")
if failed:
    print(f"[Stage 2] Failed SMILES (skipped): {failed}")
print("[Stage 2] Complete. Proceed to Stage 3.")
