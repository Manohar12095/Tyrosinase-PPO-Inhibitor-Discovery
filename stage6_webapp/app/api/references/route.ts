import { NextResponse } from 'next/server';
import { getResultsData } from '../../../lib/api';

export async function GET() {
  const { data, error } = getResultsData();
  
  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to load data' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const references = data.compounds.filter(c => c.type === 'reference');

  return NextResponse.json(references, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
