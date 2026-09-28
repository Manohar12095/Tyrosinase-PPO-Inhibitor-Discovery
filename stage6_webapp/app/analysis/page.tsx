import { getResultsData } from "../../lib/api";
import AnalysisContent from "../../components/AnalysisContent";

export default function AnalysisPage() {
  const { data } = getResultsData();
  
  if (!data) return <div className="text-white text-center mt-20">Loading...</div>;

  return <AnalysisContent data={data} />;
}
