import type { OpenAPIV3 } from 'openapi-types';

declare module 'swagger-jsdoc' {
  // OpenAPI v3 に対応した最小限の型
  export interface SwaggerJSDocOptions {
    definition: OpenAPIV3.Document;
    apis: string[];
  }
  const swaggerJSDoc: (options: SwaggerJSDocOptions) => OpenAPIV3.Document;
  export default swaggerJSDoc;
}
