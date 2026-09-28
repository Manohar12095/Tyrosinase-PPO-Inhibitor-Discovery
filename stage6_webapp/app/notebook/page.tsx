import { Code } from "lucide-react";

export default function NotebookPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#3DDC97]/20 flex items-center justify-center">
          <Code className="text-[#3DDC97]" />
        </div>
        <h1 className="text-3xl font-bold text-white">Jupyter Notebook</h1>
      </div>

      <div className="glass-card p-8 text-center text-[#8A93AD]">
        <p className="mb-4">Interactive Jupyter Notebook viewer.</p>
        <p className="text-sm">Allows researchers to reproduce the docking workflow and analysis.</p>
      </div>
    </div>
  );
}
