import { z } from 'zod';

export const projectCreationSchema = z.object({
  name: z
    .string({ required_error: 'プロトタイプ名が必要です' })
    .min(1, { message: 'プロトタイプ名が必要です' }),
});
