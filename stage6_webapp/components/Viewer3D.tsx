"use client";

import { useEffect, useRef } from "react";

export default function Viewer3D({ pdbUrl, ligandUrl }: { pdbUrl: string, ligandUrl: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current || !(window as any).$3Dmol) return;
    
    const viewer = (window as any).$3Dmol.createViewer(viewerRef.current, {
      backgroundColor: "rgba(0,0,0,0)"
    });

    // Load receptor
    fetch(pdbUrl)
      .then(res => res.text())
      .then(data => {
        viewer.addModel(data, "pdb");
        viewer.setStyle({ model: 0 }, { cartoon: { color: "white", opacity: 0.3 } });
        
        // Highlight Copper ions (CU)
        viewer.setStyle({ resn: "CU" }, { sphere: { color: "#22E3D0", radius: 1.0 } });
        // Highlight Histidines (assuming coordinating ones are near CU)
        viewer.setStyle({ resn: "HIS", within: { distance: 4.0, sel: { resn: "CU" } } }, { stick: { colorscheme: "whiteCarbon" } });
        
        viewer.zoomTo();
        viewer.render();
      });

    // Load ligand
    if (ligandUrl) {
      fetch(ligandUrl)
        .then(res => res.text())
        .then(data => {
          viewer.addModel(data, "pdb");
          viewer.setStyle({ model: -1 }, { stick: { colorscheme: "magentaCarbon", radius: 0.2 } });
          viewer.render();
        });
    }

    return () => {
      viewer.clear();
    };
  }, [pdbUrl, ligandUrl]);

  return <div ref={viewerRef} className="w-full h-full absolute inset-0" />;
}
