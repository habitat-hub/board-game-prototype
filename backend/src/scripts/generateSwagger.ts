import path from 'path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import { Model, ModelStatic, DataTypes } from 'sequelize';

const backendRootDir: string = path.resolve(__dirname, '..', '..');
const modelsDir = path.join(backendRootDir, 'src', 'models');
const swaggerSchemasOutputPath = path.join(
  backendRootDir,
  'src',
  'swagger-schemas.ts'
);
const metadataDir = path.join(backendRootDir, 'src', 'scripts', 'metadata');
const swaggerMetadataPath = path.join(metadataDir, 'swagger-schemas.json');

// 共通レスポンススキーマ
const commonSchemas = {
  SuccessResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: '処理成功時のメッセージ',
      },
    },
    required: ['message'],
    example: {
      message: '正常に処理が完了しました',
    },
  },
  Error400Response: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'エラーメッセージ',
      },
    },
    required: ['error'],
    example: {
      error: 'リクエストが不正です',
    },
  },
  Error401Response: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'エラーメッセージ',
      },
    },
    required: ['error'],
    example: {
      error: '認証が必要です',
    },
  },
  Error404Response: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'エラーメッセージ',
      },
    },
    required: ['error'],
    example: {
      error: 'リソースが見つかりません',
    },
  },
  Error500Response: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'エラーメッセージ',
      },
    },
    required: ['error'],
    example: {
      error: '予期せぬエラーが発生しました',
    },
  },
};

type SwaggerType = Record<string, unknown>;

interface SwaggerMetadata {
  dependencies: string[];
  outputs: string[];
}

type ModelWithDefaultScope = ModelStatic<Model> & {
  options?: {
    defaultScope?: {
      attributes?: {
        exclude?: string[];
      };
    };
  };
};

function normalizePaths(filePaths: string[]): string[] {
  return filePaths
    .map((filePath: string) => {
      return path.relative(backendRootDir, filePath).replace(/\\+/g, '/');
    })
    .sort();
}

function readSwaggerMetadata(): SwaggerMetadata | null {
  if (!existsSync(swaggerMetadataPath)) {
    return null;
  }

  try {
    const raw: string = readFileSync(swaggerMetadataPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as { dependencies?: unknown }).dependencies)
    ) {
      return null;
    }

    const dependencies = (parsed as { dependencies: string[] }).dependencies;
    const outputs = Array.isArray((parsed as { outputs?: unknown }).outputs)
      ? ((parsed as { outputs: string[] }).outputs as string[])
      : [];

    return {
      dependencies,
      outputs,
    };
  } catch (error: unknown) {
    console.warn(
      'Failed to read Swagger metadata. Regenerating schemas.',
      error
    );
    return null;
  }
}

function writeSwaggerMetadata(dependencies: string[], outputs: string[]): void {
  const metadata: SwaggerMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(metadataDir, { recursive: true });
  writeFileSync(swaggerMetadataPath, JSON.stringify(metadata, null, 2));
}

function haveListsChanged(
  currentList: string[],
  previousList: string[]
): boolean {
  if (currentList.length !== previousList.length) {
    return true;
  }

  return currentList.some((value: string, index: number) => {
    return value !== previousList[index];
  });
}

function listModelFiles(): string[] {
  const entries: string[] = readdirSync(modelsDir);

  return entries
    .filter((fileName: string) => {
      return fileName.endsWith('.ts');
    })
    .map((fileName: string) => {
      return path.join(modelsDir, fileName);
    });
}

function shouldRegenerateSwagger(): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const dependencyFiles: string[] = [__filename, ...listModelFiles()];
  const normalizedDependencies: string[] = normalizePaths(dependencyFiles);
  const outputFiles: string[] = [swaggerSchemasOutputPath];
  const normalizedOutputs: string[] = normalizePaths(outputFiles);

  if (!existsSync(swaggerSchemasOutputPath)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const metadata: SwaggerMetadata | null = readSwaggerMetadata();

  if (metadata === null) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  if (haveListsChanged(normalizedDependencies, metadata.dependencies)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  if (haveListsChanged(normalizedOutputs, metadata.outputs)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const latestDependencyMTime: number = dependencyFiles.reduce(
    (latest: number, filePath: string) => {
      const mtime: number = existsSync(filePath)
        ? statSync(filePath).mtimeMs
        : 0;
      return Math.max(latest, mtime);
    },
    0
  );

  const outputStat = statSync(swaggerSchemasOutputPath);
  const shouldRegenerate: boolean = latestDependencyMTime > outputStat.mtimeMs;

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate,
  };
}

function getSwaggerType(
  sequelizeType: unknown,
  allowNull: boolean = false
): SwaggerType | { oneOf: [SwaggerType, { type: 'null' }] } {
  const type = String(sequelizeType).toLowerCase();

  let swaggerType: SwaggerType;

  if (sequelizeType instanceof DataTypes.ENUM) {
    swaggerType = {
      type: 'string',
      enum: (sequelizeType as DataTypes.EnumDataType<string>).values,
    };
  } else if (sequelizeType instanceof DataTypes.ARRAY) {
    const itemType = getSwaggerType(
      (sequelizeType as { options: { type: unknown } }).options.type
    );
    swaggerType = {
      type: 'array',
      items: itemType,
    };
  } else if (type.includes('uuid')) {
    swaggerType = {
      type: 'string',
      format: 'uuid',
    };
  } else if (type.includes('int') || type.includes('float')) {
    swaggerType = { type: 'integer' };
  } else if (type.includes('boolean')) {
    swaggerType = { type: 'boolean' };
  } else if (type.includes('date')) {
    swaggerType = {
      type: 'string',
      format: 'date-time',
    };
  } else if (type.includes('json')) {
    swaggerType = {
      type: 'object',
      additionalProperties: true,
    };
  } else {
    swaggerType = { type: 'string' };
  }

  if (allowNull) {
    return {
      oneOf: [swaggerType, { type: 'null' }],
    };
  }

  return swaggerType;
}

function generateSwaggerSchema(model: ModelStatic<Model>) {
  const attributes = model.getAttributes();
  const defaultScope =
    (model as ModelWithDefaultScope).options?.defaultScope?.attributes
      ?.exclude || [];
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, attribute] of Object.entries(attributes)) {
    if (defaultScope.includes(key)) {
      continue;
    }

    if (key.startsWith('_')) {
      continue;
    }

    properties[key] = getSwaggerType(attribute.type, attribute.allowNull);

    if (!attribute.allowNull) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function buildSwaggerFile(): string {
  let output = `// This file is auto-generated. DO NOT EDIT.
/* eslint-disable */
export const swaggerSchemas = {
  components: {
    schemas: {
      ...${JSON.stringify(commonSchemas, null, 6)},`;

  readdirSync(modelsDir)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .forEach((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modelModule = require(path.join(modelsDir, file));
      const model = modelModule.default;
      if (model && model.prototype instanceof Model) {
        const schema = generateSwaggerSchema(model);
        output += `
      ${model.name}: ${JSON.stringify(schema, null, 6)},`;
      }
    });

  output += `
    }
  }
};`;
  return output;
}

async function generateSwagger(): Promise<void> {
  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateSwagger();

  if (!regenerationAssessment.shouldRegenerate) {
    console.log('Swagger schemas are up to date. Skipping generation.');
    return;
  }

  const fileContents: string = buildSwaggerFile();
  writeFileSync(swaggerSchemasOutputPath, fileContents);
  writeSwaggerMetadata(
    regenerationAssessment.dependencies,
    regenerationAssessment.outputs
  );
  console.log('Swagger schemas generated successfully!');
}

generateSwagger().catch((error: unknown) => {
  console.error('An error occurred while generating Swagger schemas.', error);
  process.exit(1);
});
