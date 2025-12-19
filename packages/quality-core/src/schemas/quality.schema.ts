import { z } from 'zod';

export const ViolationSchema = z.object({
    area: z.string(),
    metric: z.string(),
    value: z.number(),
    threshold: z.number(),
    severity: z.enum(['info', 'warn', 'error'])
});

export const QualitySchema = z.object({
    meta: z.object({
        projectId: z.string(),
        preset: z.string(),
        commit: z.string(),
        generatedAt: z.string()
    }),
    summary: z.object({
        score: z.number().min(0).max(100),
        status: z.enum(['pass', 'warn', 'fail'])
    }),
    metrics: z.record(z.record(z.union([z.number(), z.boolean()]))),
    violations: z.array(ViolationSchema)
});
