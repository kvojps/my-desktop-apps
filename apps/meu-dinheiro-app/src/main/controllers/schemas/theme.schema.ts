import { z } from 'zod';

export const themeModeSchema = z.enum(['light', 'dark']);
