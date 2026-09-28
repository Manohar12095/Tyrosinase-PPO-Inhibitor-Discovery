import { getResultsData } from "../lib/api";
import DashboardContent from "../components/DashboardContent";

export default function Home() {
  const { data, error } = getResultsData();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="glass-card p-8 text-center max-w-lg border-[#F0625D]/30">
          <div className="w-16 h-16 rounded-full bg-[#F0625D]/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F0625D" strokeWidth="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Data Validation Failed</h2>
          <p className="text-[#8A93AD] text-sm mb-6">{error}</p>
          <p className="text-xs text-white/50 font-mono text-left bg-black/40 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
            Ensure public/data/results.json exists and matches the expected schema.
          </p>
        </div>
      </div>
    );
  }

  if (data.compounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="glass-card p-8 text-center max-w-lg border-[#F5B942]/30">
          <div className="w-16 h-16 rounded-full bg-[#F5B942]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-[#F5B942] text-2xl font-bold">0</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Compounds Found</h2>
          <p className="text-[#8A93AD] text-sm mb-6">The results.json file was loaded successfully, but contains 0 compounds. This is an invalid state.</p>
        </div>
      </div>
    );
  }

  return <DashboardContent data={data} />;
}
