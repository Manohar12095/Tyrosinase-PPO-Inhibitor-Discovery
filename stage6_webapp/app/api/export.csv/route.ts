import { NextResponse } from 'next/server';
import { getResultsData } from '../../../lib/api';

export async function GET() {
  const { data, error } = getResultsData();
  
  if (error || !data) {
    return new NextResponse('Failed to load data', { status: 500 });
  }

  const header = ['ID', 'Name', 'Type', 'Rank', 'SMILES', 'Vina Score', 'Composite Score', 'Safety', 'MW', 'LogP', 'HBA', 'HBD', 'TPSA'].join(',');
  const rows = data.compounds.map(c => [
    c.id,
    `"${c.name}"`,
    c.type,
    c.rank || '',
    `"${c.smiles}"`,
    c.vina_score || '',
    c.composite_score || '',
    c.safety_class || 'UNKNOWN',
    c.mw,
    c.logp,
    c.hba,
    c.hbd,
    c.tpsa
  ].join(','));

  const csv = [header, ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="ctrl_cell_screening_results.csv"',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
