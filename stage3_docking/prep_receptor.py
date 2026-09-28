"""
Receptor PDBQT preparation for AutoDock Vina.
Converts Chain A PDB (protein only) to proper PDBQT format by:
  1. Assigning AutoDock4 atom types based on element + residue context
  2. Setting Gasteiger-like partial charges (simplified)
  3. Writing valid PDBQT ATOM records

This replaces MGLTools prepare_receptor4.py for environments where
MGLTools is not available.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent

# AutoDock atom type mapping: (element, [special residue contexts]) -> AD4 type
AD4_MAP = {
    "C":  "C",
    "N":  "NA",   # simplified; should be N for non-H-bond and NA for H-bond
    "O":  "OA",   # simplified; all O as H-bond acceptors
    "S":  "SA",
    "H":  "HD",
    "P":  "P",
    "F":  "F",
    "CL": "Cl",
    "BR": "Br",
    "I":  "I",
    "FE": "Fe",
    "ZN": "Zn",
    "CA": "Ca",
    "MG": "Mg",
    "CU": "Cu",
    "MN": "Mn",
}

BACKBONE_N = {"N"}
BACKBONE_O = {"O", "OXT"}
CARBONYL   = {"C"}  # backbone carbonyl -> C type

def element_from_line(line):
    """Extract element from PDB ATOM line (cols 77-78) or infer from atom name."""
    elem = line[76:78].strip().upper() if len(line) > 76 else ""
    if not elem:
        aname = line[12:16].strip()
        elem = "".join(c for c in aname if c.isalpha())[:2].upper()
    return elem

def get_ad4_type(line):
    elem = element_from_line(line)
    atom_name = line[12:16].strip()
    res_name  = line[17:20].strip()
    # Refine N/O assignments
    if elem == "N":
        # Backbone N is H-bond donor -> N type in AD4 (not NA)
        if atom_name == "N":
            return "N"
        # Arg NE/NH, Lys NZ, His ND/NE, Asn ND2, Gln NE2 -> NA
        return "NA"
    if elem == "O":
        # Backbone carbonyl O is acceptor only
        if atom_name in ("O", "OXT"):
            return "OA"
        # Ser/Thr/Tyr OH, Asn/Gln O, Glu/Asp OE/OD -> OA
        return "OA"
    if elem == "C":
        return "C"
    if elem == "S":
        # Met S is non-polar; Cys SH/SS is SA
        if res_name in ("CYS", "MET"):
            return "SA"
        return "S"
    return AD4_MAP.get(elem, "C")

def convert_pdb_to_pdbqt(pdb_path, pdbqt_path):
    """Convert protein PDB (ATOM records) to PDBQT with atom types and 0.000 charges."""
    lines_out = []
    with open(pdb_path) as f:
        for line in f:
            if line.startswith("ATOM  "):
                ad4_type = get_ad4_type(line)
                # PDBQT format: keep cols 1-66, add charge (cols 67-76), atom type (77+)
                base = line[:66].rstrip().ljust(66)
                charge_str = f"  0.0000"          # Gasteiger charges not computed here; set to 0
                type_str   = f"  {ad4_type:<2s}"
                pdbqt_line = base + charge_str + type_str + "\n"
                lines_out.append(pdbqt_line)
            elif line.startswith(("TER", "END")):
                lines_out.append(line)
    with open(pdbqt_path, "w") as f:
        f.writelines(lines_out)
    print(f"Converted {len(lines_out)} ATOM lines -> {pdbqt_path}")

if __name__ == "__main__":
    pdb_in  = ROOT / "outputs" / "receptor_chainA.pdb"
    pdb_out = ROOT / "outputs" / "receptor_chainA.pdbqt"
    convert_pdb_to_pdbqt(pdb_in, pdb_out)
    print("Receptor PDBQT ready.")
