import path from 'path';
import { swaggerSchemas } from '../swagger-schemas';

const backendRootDir: string = path.resolve(__dirname, '..', '..');
const ROUTES_GLOB: string = path.resolve(
  backendRootDir,
  'src',
  'routes',
  '*.ts'
);

const DESCRIPTION = `## 概要
このAPIは、ボードゲームプロトタイプの作成と管理を行うためのものです。

## 認証
- 基本的にAPIエンドポイントは認証が必要です
- アプリケーションを起動し、Google OAuth2.0を使用した認証を行なってください（Swagger UIでは認証ができません）
- 認証後、Cookieにセッション情報が保存されます
`;

export function buildSwaggerOptions(): {
  definition: Record<string, unknown>;
  apis: string[];
} {
  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Board Game Prototype API',
        version: '1.0.0',
        description: DESCRIPTION,
      },
      ...swaggerSchemas,
    },
    apis: [ROUTES_GLOB],
  };
}
