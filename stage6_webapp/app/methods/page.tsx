import { Settings } from "lucide-react";

export default function MethodsPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#A678F5]/20 flex items-center justify-center">
          <Settings className="text-[#A678F5]" />
        </div>
        <h1 className="text-3xl font-bold text-white">Methods & Pipeline</h1>
      </div>

      <div className="glass-card p-8 text-center text-[#8A93AD]">
        <p className="mb-4">Computational Pipeline Architecture diagram goes here.</p>
        <p className="text-sm">Detailed methodology regarding AutoDock Vina, RDKit, and safety flag descriptors.</p>
      </div>
    </div>
  );
}
