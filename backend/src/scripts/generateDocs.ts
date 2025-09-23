import path from 'path';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { spawnSync, SpawnSyncReturns } from 'child_process';

const backendDir: string = path.resolve(__dirname, '..', '..');
const projectRootDir: string = path.resolve(backendDir, '..');
const swaggerOutputPath: string = path.join(
  backendDir,
  '__generated__',
  'swagger-output.json'
);
const docsOutputPath: string = path.join(
  backendDir,
  '__generated__',
  'index.html'
);
const docsPublishDir: string = path.join(projectRootDir, 'docs');
const docsPublishPath: string = path.join(docsPublishDir, 'index.html');
const metadataDir: string = path.join(
  backendDir,
  'src',
  'scripts',
  '__generated__'
);
const redocMetadataPath: string = path.join(metadataDir, 'redoc-metadata.json');
const generatorScriptPath: string = __filename;

interface RedocMetadata {
  dependencies: string[];
  outputs: string[];
}

function normalizePaths(filePaths: string[]): string[] {
  return filePaths
    .map((filePath: string) => {
      return path.relative(projectRootDir, filePath).replace(/\\+/g, '/');
    })
    .sort();
}

function readRedocMetadata(): RedocMetadata | null {
  if (!existsSync(redocMetadataPath)) {
    return null;
  }

  try {
    const metadataRaw: string = readFileSync(redocMetadataPath, 'utf-8');
    const parsedMetadata: unknown = JSON.parse(metadataRaw);

    if (
      typeof parsedMetadata !== 'object' ||
      parsedMetadata === null ||
      !Array.isArray(
        (parsedMetadata as { dependencies?: unknown }).dependencies
      ) ||
      !Array.isArray((parsedMetadata as { outputs?: unknown }).outputs)
    ) {
      return null;
    }

    return parsedMetadata as RedocMetadata;
  } catch (error: unknown) {
    console.warn(
      'Failed to read Redoc metadata. Regenerating documentation.',
      error
    );
    return null;
  }
}

function writeRedocMetadata(dependencies: string[], outputs: string[]): void {
  const metadata: RedocMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(metadataDir, { recursive: true });
  writeFileSync(redocMetadataPath, JSON.stringify(metadata, null, 2));
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

function shouldRegenerateDocs(): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const dependencyFiles: string[] = [generatorScriptPath, swaggerOutputPath];
  const normalizedDependencies: string[] = normalizePaths(dependencyFiles);
  const outputFiles: string[] = [docsOutputPath, docsPublishPath];
  const normalizedOutputs: string[] = normalizePaths(outputFiles);

  const metadata: RedocMetadata | null = readRedocMetadata();

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

  const outputsExist: boolean = outputFiles.every((filePath: string) => {
    return existsSync(filePath);
  });

  if (!outputsExist) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const latestDependencyMTime: number = dependencyFiles.reduce(
    (latest: number, filePath: string) => {
      const dependencyStat: number = existsSync(filePath)
        ? statSync(filePath).mtimeMs
        : 0;
      return Math.max(latest, dependencyStat);
    },
    0
  );

  const outputStats = outputFiles.map((filePath: string) => {
    return statSync(filePath);
  });
  const oldestOutputMTime: number = outputStats.reduce(
    (oldest: number, fileStat) => {
      return Math.min(oldest, fileStat.mtimeMs);
    },
    Number.POSITIVE_INFINITY
  );
  const shouldRegenerate: boolean = latestDependencyMTime > oldestOutputMTime;

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate,
  };
}

async function generateDocs(): Promise<void> {
  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateDocs();

  if (!regenerationAssessment.shouldRegenerate) {
    console.log('API docs are up to date. Skipping Redoc build.');
    return;
  }

  const redocCliPath: string = path.join(
    backendDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'redocly.cmd' : 'redocly'
  );

  mkdirSync(path.dirname(docsOutputPath), { recursive: true });

  const result: SpawnSyncReturns<Buffer> = spawnSync(
    redocCliPath,
    ['build-docs', swaggerOutputPath, '--output', docsOutputPath],
    {
      cwd: backendDir,
      stdio: 'inherit',
    }
  );

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error('redocly build-docs failed.');
  }

  mkdirSync(docsPublishDir, { recursive: true });
  copyFileSync(docsOutputPath, docsPublishPath);

  writeRedocMetadata(
    regenerationAssessment.dependencies,
    regenerationAssessment.outputs
  );
  console.log('API docs generated successfully!');
}

generateDocs().catch((error: unknown) => {
  console.error('An error occurred while generating API docs.', error);
  process.exit(1);
});
