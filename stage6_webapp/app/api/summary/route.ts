import { NextResponse } from 'next/server';
import { getResultsData } from '../../../lib/api';

export async function GET() {
  const { data, error } = getResultsData();
  
  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to load data' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const summary = {
    total_screened: data.compounds.length,
    candidates: data.compounds.filter(c => c.type === 'candidate').length,
    references: data.compounds.filter(c => c.type === 'reference').length,
    best_vina_score: Math.min(...data.compounds.map(c => c.vina_score || 999)),
    top_candidate: data.compounds.filter(c => c.type === 'candidate').sort((a, b) => (a.rank || 999) - (b.rank || 999))[0]?.id,
    target: data.meta.pdb_id,
    generated_at: data.meta.generated_at
  };

  return NextResponse.json(summary, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
