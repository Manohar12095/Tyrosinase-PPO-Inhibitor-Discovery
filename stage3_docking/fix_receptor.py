from pathlib import Path
ROOT = Path(__file__).parent.parent

AD4_MAP = {
    "C":"C","N":"NA","O":"OA","S":"SA","H":"HD","P":"P",
    "F":"F","CL":"Cl","BR":"Br","I":"I",
    "FE":"Fe","ZN":"Zn","CA":"Ca","MG":"Mg","CU":"Cu","MN":"Mn",
}

def element_from_line(line):
    elem = line[76:78].strip().upper() if len(line) > 76 else ""
    if not elem:
        aname = line[12:16].strip()
        elem = "".join(c for c in aname if c.isalpha())[:2].upper()
    return elem

def get_ad4_type(line):
    elem = element_from_line(line)
    atom_name = line[12:16].strip()
    if elem == "N":
        return "N" if atom_name == "N" else "NA"
    if elem == "O":
        return "OA"
    if elem == "C":
        return "C"
    if elem == "S":
        return "SA" if line[17:20].strip() in ("CYS","MET") else "S"
    return AD4_MAP.get(elem, "C")

pdb_in   = ROOT / "outputs" / "receptor_chainA.pdb"
pdbqt_out= ROOT / "outputs" / "receptor_chainA.pdbqt"
lines_out = []
with open(pdb_in) as f:
    for line in f:
        if line.startswith("ATOM  "):
            ad4 = get_ad4_type(line)
            # Exact PDBQT format matching meeko output:
            # cols 0-65: PDB atom record (66 chars)
            # cols 66-69: 4 spaces
            # cols 70-75: charge (+0.000 format, 6 chars)
            # col 76: space
            # cols 77-78: atom type (2 chars left-justified)
            base = line[:66].rstrip()
            # Pad base to exactly 66 chars
            base = base.ljust(66)
            pdbqt_line = f"{base}    +0.000 {ad4:<2s}\n"
            lines_out.append(pdbqt_line)
        elif line.startswith("TER"):
            lines_out.append("TER\n")
lines_out.append("END\n")
with open(pdbqt_out, "w") as f:
    f.writelines(lines_out)
print(f"Written {len(lines_out)} lines to {pdbqt_out}")
with open(pdbqt_out) as f:
    for i,l in enumerate(f):
        print(f"len={len(l.rstrip())} | {repr(l)}")
        if i>1: break
