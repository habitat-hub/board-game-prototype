declare module 'openapi-types' {
  // Minimal OpenAPI v3 type surface used in this project
  // This avoids adding a new dependency just for types.
  export namespace OpenAPIV3 {
    export interface InfoObject {
      title: string;
      version: string;
      description?: string;
    }

    export interface Document {
      openapi: string; // e.g., '3.0.0'
      info: InfoObject;
      servers?: unknown[];
      paths?: Record<string, unknown>;
      components?: Record<string, unknown>;
      tags?: Array<Record<string, unknown>>;
      [extension: string]: unknown;
    }
  }
}

