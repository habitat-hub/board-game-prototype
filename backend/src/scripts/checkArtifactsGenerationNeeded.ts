import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  stale: boolean;
  reason: string | null;
}

interface Metadata {
  dependencies: string[];
  outputs: string[];
}

const backendRoot: string = path.resolve(__dirname, '..', '..');
const repoRoot: string = path.resolve(backendRoot, '..');
const metadataDir: string = path.join(
  backendRoot,
  'src',
  'scripts',
  'metadata'
);

function readJson(filePath: string): Metadata | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw: string = fs.readFileSync(filePath, 'utf-8');
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
    console.error(
      `Failed to parse JSON at ${path.relative(repoRoot, filePath)}`,
      error
    );
    return null;
  }
}

function normalizePaths(filePaths: string[], baseDir: string): string[] {
  return filePaths
    .map((filePath: string) => {
      return path.relative(baseDir, filePath).replace(/\\+/g, '/');
    })
    .sort();
}

function haveListsChanged(
  currentList: string[],
  previousList: string[] | undefined
): boolean {
  if (!Array.isArray(previousList)) {
    return true;
  }

  if (currentList.length !== previousList.length) {
    return true;
  }

  return currentList.some((value: string, index: number) => {
    return value !== previousList[index];
  });
}

function latestMTime(filePaths: string[]): number {
  return filePaths.reduce((latest: number, filePath: string) => {
    if (!fs.existsSync(filePath)) {
      return latest;
    }

    try {
      const stat = fs.statSync(filePath);
      return Math.max(latest, stat.mtimeMs);
    } catch (error: unknown) {
      console.error(`Failed to read timestamp for ${filePath}`, error);
      return latest;
    }
  }, 0);
}

function collectOutputFiles(directory: string, baseDir: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectOutputFiles(entryPath, baseDir);
    }

    return [path.relative(baseDir, entryPath).replace(/\\+/g, '/')];
  });

  files.sort();
  return files;
}

function collectRouteFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectRouteFiles(entryPath);
    }

    if (!entry.name.endsWith('.ts')) {
      return [];
    }

    // Ignore test files so they do not trigger regeneration
    if (/\.(test|spec)\.ts$/u.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });
}

function checkErd(): CheckResult {
  const metadataPath = path.join(metadataDir, 'erd.json');
  const erdOutputPath = path.join(backendRoot, 'erd.svg');
  const modelsDir = path.join(backendRoot, 'src', 'models');
  const generatorPath = path.join(
    backendRoot,
    'src',
    'scripts',
    'generateErd.ts'
  );
  const associationsPath = path.join(
    backendRoot,
    'src',
    'database',
    'associations.ts'
  );

  const modelFiles = fs.existsSync(modelsDir)
    ? fs
        .readdirSync(modelsDir)
        .filter((fileName: string) => fileName.endsWith('.ts'))
        .map((fileName: string) => path.join(modelsDir, fileName))
    : [];

  const dependencyFiles: string[] = [
    generatorPath,
    associationsPath,
    ...modelFiles,
  ];
  const normalizedDependencies = normalizePaths(dependencyFiles, backendRoot);
  const metadata = readJson(metadataPath);

  if (!fs.existsSync(erdOutputPath)) {
    return { name: 'erd', stale: true, reason: 'missing-output' };
  }

  if (
    metadata === null ||
    haveListsChanged(normalizedDependencies, metadata.dependencies)
  ) {
    return { name: 'erd', stale: true, reason: 'dependency-change' };
  }

  const latestDependencyMTime = latestMTime(dependencyFiles);
  const erdStat = fs.statSync(erdOutputPath);
  const shouldRegenerate = latestDependencyMTime > erdStat.mtimeMs;

  return {
    name: 'erd',
    stale: shouldRegenerate,
    reason: shouldRegenerate ? 'dependency-newer-than-output' : null,
  };
}

function checkSwaggerSchemas(): CheckResult {
  const metadataPath = path.join(metadataDir, 'swagger-schemas.json');
  const metadata = readJson(metadataPath);
  const scriptPath = path.join(
    backendRoot,
    'src',
    'scripts',
    'generateSwagger.ts'
  );
  const modelsDir = path.join(backendRoot, 'src', 'models');
  const modelFiles = fs.existsSync(modelsDir)
    ? fs
        .readdirSync(modelsDir)
        .filter((fileName: string) => fileName.endsWith('.ts'))
        .map((fileName: string) => path.join(modelsDir, fileName))
    : [];

  const dependencyFiles = [scriptPath, ...modelFiles];
  const normalizedDependencies = normalizePaths(dependencyFiles, backendRoot);
  const outputPath = path.join(backendRoot, 'src', 'swagger-schemas.ts');
  const normalizedOutputs = normalizePaths([outputPath], backendRoot);

  if (!fs.existsSync(outputPath)) {
    return { name: 'swagger-schemas', stale: true, reason: 'missing-output' };
  }

  if (
    metadata === null ||
    haveListsChanged(normalizedDependencies, metadata.dependencies) ||
    haveListsChanged(normalizedOutputs, metadata.outputs)
  ) {
    return {
      name: 'swagger-schemas',
      stale: true,
      reason: 'dependency-change',
    };
  }

  const latestDependencyMTime = latestMTime(dependencyFiles);
  const outputStat = fs.statSync(outputPath);

  return {
    name: 'swagger-schemas',
    stale: latestDependencyMTime > outputStat.mtimeMs,
    reason:
      latestDependencyMTime > outputStat.mtimeMs
        ? 'dependency-newer-than-output'
        : null,
  };
}

function checkSwaggerOutput(): CheckResult {
  const metadataPath = path.join(metadataDir, 'swagger-output.json');
  const metadata = readJson(metadataPath);
  const generatorPath = path.join(
    backendRoot,
    'src',
    'scripts',
    'generateSwaggerOutput.ts'
  );
  const swaggerSchemasPath = path.join(
    backendRoot,
    'src',
    'swagger-schemas.ts'
  );
  const routes = collectRouteFiles(path.join(backendRoot, 'src', 'routes'));
  const swaggerOptionsPath = path.join(
    backendRoot,
    'src',
    'config',
    'swaggerOptions.ts'
  );
  const dependencyFiles = [
    generatorPath,
    swaggerSchemasPath,
    swaggerOptionsPath,
    ...routes,
  ];
  const normalizedDependencies = normalizePaths(dependencyFiles, backendRoot);
  const outputPath = path.join(backendRoot, 'swagger-output.json');
  const normalizedOutputs = normalizePaths([outputPath], backendRoot);

  if (!fs.existsSync(outputPath)) {
    return { name: 'swagger-output', stale: true, reason: 'missing-output' };
  }

  if (
    metadata === null ||
    haveListsChanged(normalizedDependencies, metadata.dependencies) ||
    haveListsChanged(normalizedOutputs, metadata.outputs)
  ) {
    return { name: 'swagger-output', stale: true, reason: 'dependency-change' };
  }

  const latestDependencyMTime = latestMTime(dependencyFiles);
  const outputStat = fs.statSync(outputPath);

  return {
    name: 'swagger-output',
    stale: latestDependencyMTime > outputStat.mtimeMs,
    reason:
      latestDependencyMTime > outputStat.mtimeMs
        ? 'dependency-newer-than-output'
        : null,
  };
}

function checkApiTypes(): CheckResult {
  const metadataPath = path.join(metadataDir, 'api-types.json');
  const metadata = readJson(metadataPath);
  const swaggerOutputPath = path.join(backendRoot, 'swagger-output.json');
  const generatorPath = path.join(
    backendRoot,
    'src',
    'scripts',
    'generateApiTypes.ts'
  );
  const outputs = collectOutputFiles(
    path.join(repoRoot, 'frontend', 'src', 'api', 'types'),
    repoRoot
  );
  const dependencyFiles = [swaggerOutputPath, generatorPath];
  const normalizedDependencies = normalizePaths(dependencyFiles, repoRoot);

  if (
    metadata === null ||
    haveListsChanged(normalizedDependencies, metadata.dependencies) ||
    haveListsChanged(outputs, metadata.outputs)
  ) {
    return { name: 'api-types', stale: true, reason: 'dependency-change' };
  }

  const expectedOutputPaths = metadata.outputs.map((relativePath: string) => {
    return path.join(repoRoot, relativePath);
  });

  if (
    expectedOutputPaths.some((outputPath: string) => !fs.existsSync(outputPath))
  ) {
    return { name: 'api-types', stale: true, reason: 'missing-output' };
  }

  const latestDependencyMTime = latestMTime([swaggerOutputPath, generatorPath]);
  const latestOutputMTime = latestMTime(expectedOutputPaths);

  return {
    name: 'api-types',
    stale: latestDependencyMTime > latestOutputMTime,
    reason:
      latestDependencyMTime > latestOutputMTime
        ? 'dependency-newer-than-output'
        : null,
  };
}

function checkDocs(): CheckResult {
  const metadataPath = path.join(metadataDir, 'redoc.json');
  const metadata = readJson(metadataPath);
  const swaggerOutputPath = path.join(backendRoot, 'swagger-output.json');
  const docsOutputPath = path.join(repoRoot, 'docs', 'index.html');
  const generatorPath = path.join(
    backendRoot,
    'src',
    'scripts',
    'generateDocs.ts'
  );

  const normalizedDependencies = normalizePaths(
    [swaggerOutputPath, generatorPath],
    repoRoot
  );
  const normalizedOutputs = normalizePaths([docsOutputPath], repoRoot);

  if (!fs.existsSync(docsOutputPath)) {
    return { name: 'docs', stale: true, reason: 'missing-output' };
  }

  if (
    metadata === null ||
    haveListsChanged(normalizedDependencies, metadata.dependencies) ||
    haveListsChanged(normalizedOutputs, metadata.outputs)
  ) {
    return { name: 'docs', stale: true, reason: 'dependency-change' };
  }

  const latestDependencyMTime = latestMTime([swaggerOutputPath, generatorPath]);
  const docsStat = fs.statSync(docsOutputPath);

  return {
    name: 'docs',
    stale: latestDependencyMTime > docsStat.mtimeMs,
    reason:
      latestDependencyMTime > docsStat.mtimeMs
        ? 'dependency-newer-than-output'
        : null,
  };
}

function main(): void {
  const checks: CheckResult[] = [
    checkErd(),
    checkSwaggerSchemas(),
    checkSwaggerOutput(),
    checkApiTypes(),
    checkDocs(),
  ];
  const staleChecks = checks.filter((result: CheckResult) => result.stale);

  if (staleChecks.length === 0) {
    console.log('fresh');
    process.exit(0);
  }

  console.log('needs');
  staleChecks.forEach((result: CheckResult) => {
    if (result.reason) {
      console.error(`• ${result.name}: ${result.reason}`);
    } else {
      console.error(`• ${result.name}: regeneration required`);
    }
  });
}

main();
