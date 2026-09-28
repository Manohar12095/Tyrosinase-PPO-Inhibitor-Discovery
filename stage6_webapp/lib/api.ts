import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ResultsSchema, Results } from './schema';

export function getResultsData(): { data: Results | null; error: string | null } {
  try {
    const dataPath = join(process.cwd(), 'public', 'data', 'results.json');
    if (!existsSync(dataPath)) {
      return { data: null, error: 'results.json not found' };
    }
    
    const rawData = readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    // Validate with Zod
    const result = ResultsSchema.safeParse(jsonData);
    
    if (!result.success) {
      console.error(result.error);
      return { data: null, error: 'Invalid data format in results.json: ' + result.error.message };
    }
    
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error("Error reading results data:", error);
    return { data: null, error: error.message || 'Failed to read data' };
  }
}
