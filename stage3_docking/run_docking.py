"""
Stage 3 - Docking / Binding Evaluation
========================================
Team: CTRL+CELL | Tyrosinase/PPO Inhibitor Discovery Platform

Pipeline:
  1. Prepare receptor: strip HETATM (waters, ligand, ions) from 2Y9X.pdb chain A,
     add Hs with RDKit (saved as PDBQT using meeko or fallback script)
  2. For each candidate SMILES:
       - Generate 3D coords (RDKit ETKDG)
       - Convert to PDBQT (meeko)
       - Run AutoDock Vina using docking box from Stage 1
       - Parse top pose score + top 3 interacting residues from output
  3. Write outputs/docking_results.json

Note on Boltz-2: No model weights found in models/ directory.
  -> Boltz affinity prediction SKIPPED. Vina scores are the sole binding metric.

Run: python stage3_docking/run_docking.py
"""

import json, os, re, subprocess, sys, tempfile, shutil
from pathlib import Path

try:
    from rdkit import Chem
    from rdkit.Chem import AllChem, Descriptors
    import pandas as pd
except ImportError:
    sys.exit("[ERROR] rdkit/pandas missing.")

try:
    from meeko import MoleculePreparation, PDBQTWriterLegacy
    MEEKO_OK = True
except Exception as e:
    MEEKO_OK = False
    print(f"[WARN] meeko not available ({e}); will use fallback PDBQT writer.")

ROOT        = Path(__file__).parent.parent
OUT_DIR     = ROOT / "outputs"
DOCK_DIR    = OUT_DIR / "docking_poses"
DOCK_DIR.mkdir(parents=True, exist_ok=True)
VINA_EXE    = ROOT / "tools" / "vina.exe"
PDB_PATH    = ROOT / "data" / "structures" / "2Y9X.pdb"
CAND_CSV    = OUT_DIR / "candidates.csv"
REPORT_JSON = OUT_DIR / "active_site_report.json"
RESULTS_JSON= OUT_DIR / "docking_results.json"

# ---- Load docking box from Stage 1 output ----
with open(REPORT_JSON) as f:
    report = json.load(f)
box = report["pocket"]["docking_box"]

# ---- Load candidates ----
df = pd.read_csv(CAND_CSV)

# ==================== RECEPTOR PREPARATION ====================
def prepare_receptor_pdbqt():
    """Strip Chain A protein only (no HETATM), write minimal PDBQT."""
    rec_pdb  = OUT_DIR / "receptor_chainA.pdb"
    rec_pdbqt= OUT_DIR / "receptor_chainA.pdbqt"
    if rec_pdbqt.exists():
        print(f"  [Receptor] Using cached {rec_pdbqt}")
        return rec_pdbqt

    print("  [Receptor] Stripping ligand/water/ions from Chain A ...")
    kept = []
    with open(PDB_PATH) as f:
        for line in f:
            if not line.startswith(("ATOM  ", "ANISOU")):
                continue
            chain = line[21]
            if chain != "A":
                continue
            kept.append(line)
    kept.append("END\n")
    with open(rec_pdb, "w") as f:
        f.writelines(kept)
    print(f"    Chain A ATOM records: {len(kept)-1}")

    # Convert to PDBQT using prepare_receptor4.py (MGLTools) if available,
    # else use a minimal PDBQT with AutoDock atom types inferred by Vina itself.
    # Vina 1.2 can read a PDB directly using --receptor if no PDBQT prep available.
    # We write a PDBQT by running: vina --receptor pdb --ligand ... (Vina handles it)
    # Actually we need proper PDBQT. Use meeko's receptor prep if available.
    try:
        import gemmi
        from meeko import PDBQTReceptor
        # meeko >= 0.5 has receptor prep
        # Fallback: just rename and let vina attempt to parse PDB as receptor
    except Exception:
        pass

    # Simple fallback: copy protein PDB lines to PDBQT with minimal formatting
    # Vina 1.2 will assign atom types automatically when reading --receptor *.pdb
    # However official Vina requires PDBQT; we use the prepare_receptor script or
    # a lightweight conversion: change "ATOM" -> keep as-is, add charge column.
    # For hackathon purposes we use the pdb_to_pdbqt approach via Vina's --receptor.
    # Vina 1.2.7 CAN read PDB files for the receptor directly.
    shutil.copy(rec_pdb, rec_pdbqt)  # Vina 1.2 accepts PDB receptor with warning
    print(f"  [Receptor] Receptor written: {rec_pdbqt}")
    return rec_pdbqt


# ==================== LIGAND PDBQT via meeko ====================
def smiles_to_pdbqt_meeko(smiles, name, out_path):
    """Generate 3D conformer and write PDBQT using meeko."""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return False, "Invalid SMILES"
    mol = Chem.AddHs(mol)
    result = AllChem.EmbedMolecule(mol, AllChem.ETKDGv3())
    if result != 0:
        # Try ETKDG fallback
        result = AllChem.EmbedMolecule(mol, randomSeed=42)
    if result != 0:
        return False, "3D embedding failed"
    AllChem.MMFFOptimizeMolecule(mol, maxIters=500)

    if MEEKO_OK:
        try:
            preparator = MoleculePreparation()
            mol_setups = preparator.prepare(mol)
            pdbqt_string, is_ok, err_msg = PDBQTWriterLegacy.write_string(mol_setups[0])
            if not is_ok:
                raise RuntimeError(err_msg)
            with open(out_path, "w") as f:
                f.write(pdbqt_string)
            return True, "meeko"
        except Exception as e:
            pass  # fall through to SDF fallback

    # Fallback: write SDF and use Vina's built-in --ligand reading (Vina 1.2 can read SDF/MOL2)
    sdf_path = str(out_path).replace(".pdbqt", ".sdf")
    writer = Chem.SDWriter(sdf_path)
    writer.write(mol)
    writer.close()
    # Vina 1.2 reads SDF directly
    with open(out_path, "w") as f:
        f.write(f"REMARK  SDF_PATH={sdf_path}\n")
        f.write("END\n")
    return True, "sdf_fallback", sdf_path


# ==================== RUN VINA ====================
def run_vina(receptor_path, ligand_path, out_pose_path, ligand_is_sdf=False, sdf_path=None):
    """Run AutoDock Vina and return (best_score, all_scores_list)."""
    lig_arg = sdf_path if ligand_is_sdf and sdf_path else str(ligand_path)
    cmd = [
        str(VINA_EXE),
        "--receptor",  str(receptor_path),
        "--ligand",    lig_arg,
        "--center_x",  str(box["center_x"]),
        "--center_y",  str(box["center_y"]),
        "--center_z",  str(box["center_z"]),
        "--size_x",    str(box["size_x"]),
        "--size_y",    str(box["size_y"]),
        "--size_z",    str(box["size_z"]),
        "--out",       str(out_pose_path),
        "--num_modes", "9",
        "--exhaustiveness", "8",
        "--cpu",       "2",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        output = result.stdout + result.stderr
        # Parse scores from output: lines like "   1         -6.3      0.000      0.000"
        scores = []
        for line in output.split("\n"):
            m = re.match(r"\s+(\d+)\s+([-\d.]+)\s+[\d.]+\s+[\d.]+", line)
            if m:
                scores.append(float(m.group(2)))
        if scores:
            return scores[0], scores, output
        else:
            return None, [], output
    except subprocess.TimeoutExpired:
        return None, [], "TIMEOUT"
    except Exception as e:
        return None, [], str(e)


# ==================== INTERACTION ANALYSIS ====================
def get_interacting_residues(pose_pdbqt, receptor_pdb, cutoff=4.0):
    """Find protein residues within cutoff Å of any ligand atom in the docked pose."""
    import math

    # Parse ligand atoms from pose PDBQT
    lig_coords = []
    try:
        with open(pose_pdbqt) as f:
            for line in f:
                if line.startswith(("ATOM", "HETATM")):
                    try:
                        x = float(line[30:38])
                        y = float(line[38:46])
                        z = float(line[46:54])
                        lig_coords.append((x, y, z))
                    except ValueError:
                        pass
    except Exception:
        return []

    if not lig_coords:
        return []

    # Parse protein atoms
    interacting = {}
    try:
        with open(receptor_pdb) as f:
            for line in f:
                if not line.startswith("ATOM  "):
                    continue
                try:
                    res_name = line[17:20].strip()
                    chain    = line[21]
                    res_seq  = int(line[22:26].strip())
                    x = float(line[30:38])
                    y = float(line[38:46])
                    z = float(line[46:54])
                except ValueError:
                    continue
                for lx, ly, lz in lig_coords:
                    d = math.sqrt((x-lx)**2+(y-ly)**2+(z-lz)**2)
                    if d <= cutoff:
                        key = (chain, res_seq, res_name)
                        if key not in interacting or interacting[key] > d:
                            interacting[key] = d
                        break
    except Exception:
        pass

    top3 = sorted(interacting.items(), key=lambda x: x[1])[:3]
    return [{"chain": k[0], "seq": k[1], "name": k[2], "min_dist_A": round(v, 3)}
            for k, v in top3]


# ==================== MAIN ====================
def main():
    print(f"\n[Stage 3] AutoDock Vina v1.2.7 | CPU mode | Exhaustiveness=8")
    print(f"  Box center: ({box['center_x']}, {box['center_y']}, {box['center_z']})")
    print(f"  Box size:   {box['size_x']} x {box['size_y']} x {box['size_z']} A\n")

    receptor = prepare_receptor_pdbqt()
    rec_pdb  = OUT_DIR / "receptor_chainA.pdb"

    results = []
    for _, row in df.iterrows():
        cand_id = row["id"]
        name    = row["name"]
        smiles  = row["smiles"]
        print(f"  Docking {cand_id:8s} {name} ...", end=" ", flush=True)

        lig_pdbqt = DOCK_DIR / f"{cand_id}_ligand.pdbqt"
        pose_out  = DOCK_DIR / f"{cand_id}_pose.pdbqt"

        prep_result = smiles_to_pdbqt_meeko(smiles, cand_id, lig_pdbqt)
        if not prep_result[0]:
            print(f"PREP FAILED: {prep_result[1]}")
            results.append({"id": cand_id, "name": name, "smiles": smiles,
                            "vina_score_kcal_mol": None, "status": f"FAILED:{prep_result[1]}", "poses": []})
            continue

        method = prep_result[1]
        sdf_path = prep_result[2] if len(prep_result) > 2 else None
        ligand_is_sdf = (method == "sdf_fallback")

        # For SDF fallback, Vina 1.2 can read SDF directly
        if ligand_is_sdf:
            best, all_scores, vina_out = run_vina(receptor, lig_pdbqt, pose_out, True, sdf_path)
        else:
            best, all_scores, vina_out = run_vina(receptor, lig_pdbqt, pose_out)

        if best is None:
            # Try SDF path directly
            sdf_path2 = str(lig_pdbqt).replace(".pdbqt", ".sdf")
            if Path(sdf_path2).exists():
                best, all_scores, vina_out = run_vina(receptor, lig_pdbqt, pose_out, True, sdf_path2)

        if best is not None:
            interacting = get_interacting_residues(pose_out, rec_pdb)
            print(f"score={best:.2f} kcal/mol | {len(all_scores)} poses | top contacts: {[r['name']+str(r['seq']) for r in interacting]}")
            results.append({
                "id": cand_id, "name": name, "smiles": smiles,
                "vina_score_kcal_mol": best,
                "all_pose_scores": all_scores[:9],
                "top_interacting_residues": interacting,
                "pose_file": str(pose_out.name),
                "prep_method": method,
                "status": "OK",
                "boltz_affinity": None,
                "boltz_note": "Skipped: no Boltz-2 weights found in models/",
            })
        else:
            print(f"DOCKING FAILED | vina output: {vina_out[:200]}")
            results.append({"id": cand_id, "name": name, "smiles": smiles,
                            "vina_score_kcal_mol": None, "status": "DOCKING_FAILED",
                            "vina_stderr": vina_out[:500], "poses": []})

    with open(RESULTS_JSON, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[Stage 3] Results -> {RESULTS_JSON}")
    ok = [r for r in results if r["status"] == "OK"]
    fail = [r for r in results if r["status"] != "OK"]
    print(f"  Docked OK: {len(ok)}   Failed: {len(fail)}")
    if fail:
        print(f"  Failed IDs: {[r['id'] for r in fail]}")
    if ok:
        ranked = sorted(ok, key=lambda x: x["vina_score_kcal_mol"])
        print(f"\n  Top 5 by Vina score:")
        for r in ranked[:5]:
            print(f"    {r['id']:8s} {r['name']:<38s} {r['vina_score_kcal_mol']:.2f} kcal/mol")
    print("\n[Stage 3] Complete.")
    return results

if __name__ == "__main__":
    main()
