import { z } from 'zod';
import { QualitySchema } from '../schemas/quality.schema.js';

export type QualityResult = z.infer<typeof QualitySchema>;
export type Violation = QualityResult['violations'][number];
