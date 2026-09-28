import { NextRequest, NextResponse } from 'next/server';
import { getResultsData } from '../../../lib/api';

export async function GET(request: NextRequest) {
  const { data, error } = getResultsData();
  
  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to load data' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.toLowerCase();
  const type = searchParams.get('type');
  const safety = searchParams.get('safety');
  const sort = searchParams.get('sort') || 'composite_score';
  const order = searchParams.get('order') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  let filtered = [...data.compounds];

  if (q) {
    filtered = filtered.filter(c => 
      c.id.toLowerCase().includes(q) || 
      c.name.toLowerCase().includes(q)
    );
  }
  
  if (type) {
    filtered = filtered.filter(c => c.type === type);
  }

  if (safety) {
    filtered = filtered.filter(c => c.safety_class === safety);
  }

  filtered.sort((a: any, b: any) => {
    let valA = a[sort];
    let valB = b[sort];
    if (valA === undefined) valA = 0;
    if (valB === undefined) valB = 0;
    
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return NextResponse.json({
    count: filtered.length,
    total: data.compounds.length,
    compounds: filtered
  }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
