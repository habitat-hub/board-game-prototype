declare module 'swagger-jsdoc' {
  interface SwaggerJSDocOptions {
    definition: Record<string, unknown>;
    apis: string[];
  }
  export default function swaggerJSDoc(
    options: SwaggerJSDocOptions
  ): Record<string, unknown>;
}
