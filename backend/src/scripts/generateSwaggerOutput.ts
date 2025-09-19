import path from 'path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import swaggerJsdoc from 'swagger-jsdoc';
import { buildSwaggerOptions } from '../config/swaggerOptions';

const backendRootDir: string = path.resolve(__dirname, '..', '..');
const routesDir = path.join(backendRootDir, 'src', 'routes');
const swaggerOutputPath = path.join(backendRootDir, 'swagger-output.json');
const metadataDir = path.join(backendRootDir, 'src', 'scripts', 'metadata');
const swaggerMetadataPath = path.join(metadataDir, 'swagger-output.json');
const swaggerSchemasPath = path.join(
  backendRootDir,
  'src',
  'swagger-schemas.ts'
);
const swaggerOptionsPath = path.join(
  backendRootDir,
  'src',
  'config',
  'swaggerOptions.ts'
);
const generatorScriptPath = __filename;

interface SwaggerOutputMetadata {
  dependencies: string[];
  outputs: string[];
}

function normalizePaths(filePaths: string[]): string[] {
  return filePaths
    .map((filePath: string) => {
      return path.relative(backendRootDir, filePath).replace(/\\+/g, '/');
    })
    .sort();
}

function readMetadata(): SwaggerOutputMetadata | null {
  if (!existsSync(swaggerMetadataPath)) {
    return null;
  }

  try {
    const metadataRaw: string = readFileSync(swaggerMetadataPath, 'utf-8');
    const parsedMetadata: unknown = JSON.parse(metadataRaw);

    if (
      typeof parsedMetadata !== 'object' ||
      parsedMetadata === null ||
      !Array.isArray(
        (parsedMetadata as { dependencies?: unknown }).dependencies
      )
    ) {
      return null;
    }

    const dependencies = (parsedMetadata as { dependencies: string[] })
      .dependencies;
    const outputs = Array.isArray(
      (parsedMetadata as { outputs?: unknown }).outputs
    )
      ? ((parsedMetadata as { outputs: string[] }).outputs as string[])
      : [];

    return {
      dependencies,
      outputs,
    };
  } catch (error: unknown) {
    console.warn(
      'Failed to read Swagger output metadata. Regenerating documentation.',
      error
    );
    return null;
  }
}

function writeMetadata(dependencies: string[], outputs: string[]): void {
  const metadata: SwaggerOutputMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(metadataDir, { recursive: true });
  writeFileSync(swaggerMetadataPath, JSON.stringify(metadata, null, 2));
}

function collectRouteFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath: string = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectRouteFiles(entryPath);
    }

    if (!entry.name.endsWith('.ts')) {
      return [];
    }

    return [entryPath];
  });
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

function shouldRegenerateSwaggerOutput(): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const routeFiles: string[] = collectRouteFiles(routesDir);
  const dependencyFiles: string[] = [
    generatorScriptPath,
    swaggerSchemasPath,
    swaggerOptionsPath,
    ...routeFiles,
  ];

  const normalizedDependencies: string[] = normalizePaths(dependencyFiles);
  const outputFiles: string[] = [swaggerOutputPath];
  const normalizedOutputs: string[] = normalizePaths(outputFiles);

  if (!existsSync(swaggerOutputPath)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const metadata: SwaggerOutputMetadata | null = readMetadata();

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

  const outputStat = statSync(swaggerOutputPath);
  const shouldRegenerate: boolean = latestDependencyMTime > outputStat.mtimeMs;

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate,
  };
}

async function generateSwaggerOutput(): Promise<void> {
  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateSwaggerOutput();

  if (!regenerationAssessment.shouldRegenerate) {
    console.log('Swagger output is up to date. Skipping regeneration.');
    return;
  }

  const swaggerSpec = swaggerJsdoc(buildSwaggerOptions());
  writeFileSync(swaggerOutputPath, JSON.stringify(swaggerSpec, null, 2));
  writeMetadata(
    regenerationAssessment.dependencies,
    regenerationAssessment.outputs
  );
  console.log('Swagger output generated successfully!');
}

generateSwaggerOutput().catch((error: unknown) => {
  console.error('An error occurred while generating Swagger output.', error);
  process.exit(1);
});
