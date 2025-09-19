import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import type { Express } from 'express';

import env from './env';
import { buildSwaggerOptions } from './swaggerOptions';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

export function generateArtifacts(app: Express): void {
  if (env.NODE_ENV !== 'development') {
    return;
  }

  if (!env.SKIP_ARTIFACT_GENERATION) {
    try {
      console.log('Generating Swagger schemas...');
      execSync('npm run generate-swagger', {
        stdio: 'inherit',
        cwd: BACKEND_ROOT,
      });
      execSync('npm run generate-swagger-output', {
        stdio: 'inherit',
        cwd: BACKEND_ROOT,
      });
      execSync('npm run generate-api-types', {
        stdio: 'inherit',
        cwd: BACKEND_ROOT,
      });
    } catch (error) {
      console.error('Failed to generate Swagger schemas:', error);
    }
  } else {
    console.log('SKIP_ARTIFACT_GENERATION set: skipping artifact generation');
  }

  const outputPath = path.join(BACKEND_ROOT, 'swagger-output.json');
  if (!fs.existsSync(outputPath)) {
    console.warn(
      'Swagger output file missing after artifact generation; regenerating in-process.'
    );
    const swaggerSpecFallback = swaggerJsdoc(buildSwaggerOptions());
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpecFallback, null, 2));
  }

  const swaggerSpec = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
