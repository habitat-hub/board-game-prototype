import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env first
dotenv.config();

// Detect test environment early to relax validation for unit tests that mock deps
const isTest = process.env.NODE_ENV === 'test';

// Base schema shared across environments
const baseSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  SKIP_SWAGGER: z.string().optional(),
});

// Strict schema (dev/prod): require all variables
const strictSchema = baseSchema.extend({
  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  FRONTEND_DOMAIN: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET_NAME: z.string().min(1),
});

// Relaxed schema (test): provide safe defaults to avoid failing on import
const relaxedSchema = baseSchema.extend({
  DATABASE_URL: z
    .string()
    .default('postgres://user:pass@localhost:5432/testdb'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_DOMAIN: z.string().default('localhost'),
  SESSION_SECRET: z.string().default('test-secret'),
  GOOGLE_CLIENT_ID: z.string().default('test'),
  GOOGLE_CLIENT_SECRET: z.string().default('test'),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default('http://localhost:8080/auth/google/callback'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().default('test'),
  AWS_S3_BUCKET_NAME: z.string().default('test-bucket'),
});

const envSchema = isTest ? relaxedSchema : strictSchema;

export type Env = z.infer<typeof envSchema>;

const env: Env = envSchema.parse(process.env);

export default env;
