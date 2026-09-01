import { z } from 'zod';

export const themeModeSchema = z.union([z.literal('light'), z.literal('dark')]);
