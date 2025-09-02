import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../errors/CustomError';

export const validate =
  (schema: ZodSchema, property: 'body' | 'params' = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req[property]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => e.message).join(', ');
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
