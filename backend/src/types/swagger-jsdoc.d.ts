declare module 'swagger-jsdoc' {
  // Minimal type definition for swagger-jsdoc to satisfy linting and compilation
  const swaggerJSDoc: (options: unknown) => Record<string, unknown>;
  export default swaggerJSDoc;
}
