import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import type { Express } from 'express';

import env from './env';
import { swaggerSchemas } from '../swagger-schemas';

export function setupSwagger(app: Express) {
  if (env.NODE_ENV !== 'development') return;

  if (!env.SKIP_SWAGGER) {
    try {
      console.log('Generating Swagger schemas...');
      execSync('npm run generate-swagger', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..'),
      });
      execSync('npm run generate-api-types', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..'),
      });
    } catch (error) {
      console.error('Failed to generate Swagger schemas:', error);
    }
  } else {
    console.log('SKIP_SWAGGER set: skipping swagger generation');
  }

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Board Game Prototype API',
        version: '1.0.0',
        description: `## 概要
このAPIは、ボードゲームプロトタイプの作成と管理を行うためのものです。

## 認証
- 基本的にAPIエンドポイントは認証が必要です
- アプリケーションを起動し、Google OAuth2.0を使用した認証を行なってください（Swagger UIでは認証ができません）
- 認証後、Cookieにセッション情報が保存されます
`,
      },
      ...swaggerSchemas,
    },
    apis: ['./src/routes/*.ts'],
  };
  const swaggerSpec = swaggerJsdoc(options);
  fs.writeFileSync(
    path.join(__dirname, '..', '..', 'swagger-output.json'),
    JSON.stringify(swaggerSpec, null, 2)
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
