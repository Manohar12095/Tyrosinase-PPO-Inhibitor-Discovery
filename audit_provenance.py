import json
import glob
import os
from rdkit import Chem
from rdkit.Chem import Descriptors

def main():
    if not os.path.exists('evidence'):
        os.makedirs('evidence')
    
    with open('outputs/dossier.json', 'r') as f:
        dossier = json.load(f)
    
    with open('outputs/docking_results.json', 'r') as f:
        docking = json.load(f)
        
    with open('outputs/safety_report.json', 'r') as f:
        safety = json.load(f)

    dossier_data = {}
    for entry in dossier['section_6_recommendation']['full_ranked_table']:
        dossier_data[entry['id']] = entry

    report = []
    report.append("# Provenance Audit Report")
    report.append("")
    report.append("## Frontend Hardcoded Values")
    report.append("- In `app/page.tsx`, the following values are hardcoded in the hero section and stat strip:")
    report.append("  - `Rank 1`")
    report.append("  - `NOV005`")
    report.append("  - `−6.913 kcal/mol`")
    report.append("  - `22 compounds screened`")
    report.append("  - `5 / 22 low-concern safety class`")
    report.append("")
    
    report.append("## Data Comparison")
    report.append("| Compound | Raw Vina Score | App Vina Score | Vina Match | Raw MW | App MW | MW Match | Raw logP | App logP | logP Match | Raw Safety | App Safety | Safety Match |")
    report.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    
    for dock_info in docking:
        comp_id = dock_info['id']
        smiles = dock_info['smiles']
        
        # Read raw Vina score from pose file
        raw_vina = None
        pose_file = f"outputs/docking_poses/{comp_id}_pose.pdbqt"
        if os.path.exists(pose_file):
            with open(pose_file, 'r') as pf:
                for line in pf:
                    if line.startswith("REMARK VINA RESULT:"):
                        raw_vina = float(line.split()[3])
                        break
        
        # Compute MW and logP with RDKit
        mol = Chem.MolFromSmiles(smiles)
        raw_mw = Descriptors.MolWt(mol) if mol else None
        raw_logp = Descriptors.MolLogP(mol) if mol else None
        
        # Safety class
        safe_info = next((s for s in safety if s['id'] == comp_id), None)
        raw_safety = safe_info['computed_safety_class'] if safe_info else "no source"
        
        # App data
        app_entry = dossier_data.get(comp_id)
        if app_entry:
            app_vina = app_entry.get('vina_score')
            app_mw = app_entry.get('MW')
            app_logp = app_entry.get('logP')
            app_safety = app_entry.get('safety')
            
            vina_match = "yes" if raw_vina is not None and abs(raw_vina - app_vina) < 0.001 else "no"
            mw_match = "yes" if raw_mw is not None and abs(raw_mw - app_mw) < 0.1 else "no"
            logp_match = "yes" if raw_logp is not None and abs(raw_logp - app_logp) < 0.1 else "no"
            safety_match = "yes" if raw_safety == app_safety else "no"
            
            report.append(f"| {comp_id} | {raw_vina} | {app_vina} | {vina_match} | {raw_mw:.3f} | {app_mw} | {mw_match} | {raw_logp:.3f} | {app_logp} | {logp_match} | {raw_safety} | {app_safety} | {safety_match} |")
        else:
            report.append(f"| {comp_id} | {raw_vina} | Not in app | no | {raw_mw:.3f} | Not in app | no | {raw_logp:.3f} | Not in app | no | {raw_safety} | Not in app | no |")
            
    with open('evidence/audit_report.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))

if __name__ == '__main__':
    main()
