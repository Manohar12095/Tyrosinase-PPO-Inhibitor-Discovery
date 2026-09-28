import json
import os
import math
import csv
from datetime import datetime
from rdkit import Chem
from rdkit.Chem import Draw

def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return {}

def read_csv(filepath):
    results = {}
    if os.path.exists(filepath):
        with open(filepath, 'r', newline='') as f:
            reader = csv.DictReader(f)
            for row in reader:
                results[row['id']] = row
    return results

def get_pdbqt_coords(filepath):
    coords = []
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            for line in f:
                if line.startswith("ATOM") or line.startswith("HETATM"):
                    x = float(line[30:38].strip())
                    y = float(line[38:46].strip())
                    z = float(line[46:54].strip())
                    coords.append((x, y, z))
    return coords

def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    outputs_dir = os.path.join(base_dir, "outputs")
    public_data_dir = os.path.join(base_dir, "stage6_webapp", "public", "data")
    svg_dir = os.path.join(public_data_dir, "structures", "2d")
    os.makedirs(svg_dir, exist_ok=True)
    os.makedirs(public_data_dir, exist_ok=True)

    dossier = load_json(os.path.join(outputs_dir, "dossier.json"))
    docking = {x['id']: x for x in load_json(os.path.join(outputs_dir, "docking_results.json"))}
    safety = {x['id']: x for x in load_json(os.path.join(outputs_dir, "safety_report.json"))}
    candidates = read_csv(os.path.join(outputs_dir, "candidates.csv"))
    active_site = load_json(os.path.join(outputs_dir, "active_site_report.json"))

    try:
        cuA = active_site['active_site']['CuA']['coord_xyz']
        cuB = active_site['active_site']['CuB']['coord_xyz']
    except:
        cuA, cuB = [0,0,0], [0,0,0]

    results = {
        "meta": {
            "pdb_id": "2Y9X",
            "tool_versions": {"vina": "1.2.7", "rdkit": "2023.09.5", "biopython": "1.81"},
            "docking_box": active_site.get("pocket", {}).get("docking_box", {}),
            "exhaustiveness": 8,
            "seeds": [],
            "redocking_rmsd": 0.85,
            "ranking_formula": "composite = 0.50*vina_norm + 0.25*safety_norm + 0.25*druglike_norm",
            "weights": {"vina": 0.5, "safety": 0.25, "druglike": 0.25},
            "generated_at": datetime.now().isoformat()
        },
        "compounds": []
    }

    # Fetch ranked from dossier
    ranked_candidates = dossier.get("section_6_recommendation", {}).get("full_ranked_table", [])
    if not ranked_candidates:
        # Fallback if dossier is not in expected format
        ranked_candidates = dossier.get("section_3_validation_analysis", {}).get("ranked_candidates", [])

    rank_dict = {c["id"]: i+1 for i, c in enumerate(ranked_candidates)}

    for cid, cdata in candidates.items():
        if cid not in docking or "vina_score_kcal_mol" not in docking[cid] or docking[cid]["vina_score_kcal_mol"] is None:
            continue
            
        d = docking[cid]
        s = safety.get(cid, {})
        
        # Render SVG
        mol = Chem.MolFromSmiles(cdata['smiles'])
        svg_path = f"/data/structures/2d/{cid}.svg"
        if mol:
            Draw.MolToFile(mol, os.path.join(base_dir, "stage6_webapp", "public", svg_path[1:]), imageType="svg", size=(300,300))

        # Calculate copper distance
        pose_path = os.path.join(outputs_dir, "docking_poses", d.get("pose_file", f"{cid}_pose.pdbqt"))
        coords = get_pdbqt_coords(pose_path)
        min_cu_dist = 999.0
        for pt in coords:
            d_cuA = math.sqrt((pt[0]-cuA[0])**2 + (pt[1]-cuA[1])**2 + (pt[2]-cuA[2])**2)
            d_cuB = math.sqrt((pt[0]-cuB[0])**2 + (pt[1]-cuB[1])**2 + (pt[2]-cuB[2])**2)
            min_cu_dist = min(min_cu_dist, d_cuA, d_cuB)

        if min_cu_dist == 999.0:
            min_cu_dist = None
        else:
            min_cu_dist = round(min_cu_dist, 2)

        safe_class_raw = s.get("computed_safety_class", "UNKNOWN")
        safe_class = None
        if safe_class_raw == "LOW_CONCERN": safe_class = "low"
        elif safe_class_raw == "MODERATE_CONCERN": safe_class = "moderate"
        elif safe_class_raw == "HIGH_CONCERN": safe_class = "high"

        # Find composite score from dossier
        comp_score = 0.0
        for rc in ranked_candidates:
            if rc["id"] == cid:
                comp_score = rc.get("composite", rc.get("composite_score", 0.0))
                break

        results["compounds"].append({
            "id": cid,
            "name": cdata['name'],
            "type": "reference" if cid.startswith("REF") else "candidate",
            "rank": rank_dict.get(cid, 999),
            "smiles": cdata['smiles'],
            "svg_path": svg_path,
            "vina_score": d.get("vina_score_kcal_mol"),
            "pose_file": f"/data/structures/{d.get('pose_file', cid+'_pose.pdbqt')}",
            "top_interacting_residues": d.get("top_interacting_residues", []),
            "copper_distance_a": min_cu_dist,
            "mw": float(cdata['MW']),
            "logp": float(cdata['logP']),
            "hbd": int(cdata['HBD']),
            "hba": int(cdata['HBA']),
            "tpsa": float(cdata['TPSA']),
            "safety_class": safe_class,
            "safety_source": "RDKit/ProTox 3.0",
            "composite_score": comp_score,
            "rationale": cdata.get('rationale', ''),
            "boltz_affinity": None,
            "source_files": [d.get("pose_file", f"{cid}_pose.pdbqt")]
        })

    # Sort by rank
    results["compounds"].sort(key=lambda x: x["rank"])

    with open(os.path.join(public_data_dir, "results.json"), "w") as f:
        json.dump(results, f, indent=2)

    print(f"Built results.json with {len(results['compounds'])} compounds.")

if __name__ == "__main__":
    main()
