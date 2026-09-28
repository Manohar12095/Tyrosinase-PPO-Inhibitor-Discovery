import { z } from "zod";

export const CompoundSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["candidate", "reference"]),
  rank: z.number(),
  smiles: z.string(),
  svg_path: z.string(),
  vina_score: z.number().nullable(),
  pose_file: z.string(),
  top_interacting_residues: z.array(z.any()).default([]),
  copper_distance_a: z.number().nullable(),
  mw: z.number(),
  logp: z.number(),
  hbd: z.number(),
  hba: z.number(),
  tpsa: z.number(),
  safety_class: z.enum(["low", "moderate", "high"]).nullable(),
  safety_source: z.string(),
  composite_score: z.number(),
  rationale: z.string().default(""),
  boltz_affinity: z.number().nullable(),
  source_files: z.array(z.string()).default([]),
});

export const MetaSchema = z.object({
  pdb_id: z.string(),
  tool_versions: z.record(z.string(), z.string()),
  docking_box: z.any(),
  exhaustiveness: z.number(),
  seeds: z.array(z.any()),
  redocking_rmsd: z.number().nullable().optional(),
  ranking_formula: z.string(),
  weights: z.record(z.string(), z.number()),
  generated_at: z.string(),
});

export const ResultsSchema = z.object({
  meta: MetaSchema,
  compounds: z.array(CompoundSchema),
});

export type Compound = z.infer<typeof CompoundSchema>;
export type Meta = z.infer<typeof MetaSchema>;
export type Results = z.infer<typeof ResultsSchema>;
