import { NextRequest, NextResponse } from 'next/server';
import { getResultsData } from '../../../../lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { data, error } = getResultsData();
  
  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to load data' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const compound = data.compounds.find(c => c.id === resolvedParams.id);
  
  if (!compound) {
    return NextResponse.json({ error: 'Compound not found' }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  return NextResponse.json(compound, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
