import { FileText } from "lucide-react";

export default function DossierPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#5B8CFF]/20 flex items-center justify-center">
          <FileText className="text-[#5B8CFF]" />
        </div>
        <h1 className="text-3xl font-bold text-white">Full Dossier</h1>
      </div>

      <div className="glass-card p-8 text-center text-[#8A93AD]">
        <p className="mb-4">Dossier Markdown / PDF download link.</p>
        <p className="text-sm">Includes all research context, literature review, and safety protocols.</p>
      </div>
    </div>
  );
}
