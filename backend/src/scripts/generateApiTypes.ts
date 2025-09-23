import path from 'path';
import {
  Dirent,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
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
const apiClientOutputDir: string = path.join(
  projectRootDir,
  'frontend',
  'src',
  '__generated__',
  'api',
  'client'
);
const metadataDir: string = path.join(
  backendDir,
  'src',
  'scripts',
  '__generated__'
);
const apiTypesMetadataPath: string = path.join(
  metadataDir,
  'api-types-metadata.json'
);
const generatorScriptPath: string = __filename;

interface ApiTypesMetadata {
  dependencies: string[];
  outputs: string[];
}

/** 依存パスを正規化してソート */
function normalizePaths(filePaths: string[]): string[] {
  const normalizedPaths: string[] = filePaths
    .map((filePath: string) => {
      return path.relative(projectRootDir, filePath).replace(/\\+/g, '/');
    })
    .sort();

  return normalizedPaths;
}

/** 生成済み API 型メタデータを読み込み */
function readApiTypesMetadata(): ApiTypesMetadata | null {
  // メタデータが存在しない場合は再生成対象
  if (!existsSync(apiTypesMetadataPath)) {
    return null;
  }

  try {
    const metadataRaw: string = readFileSync(apiTypesMetadataPath, 'utf-8');
    const parsedMetadata: unknown = JSON.parse(metadataRaw);

    // 期待する構造でない場合は再生成対象
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

    const metadata: ApiTypesMetadata = parsedMetadata as ApiTypesMetadata;
    return metadata;
  } catch (error: unknown) {
    console.warn(
      'Failed to read API type metadata. Regenerating artifacts.',
      error
    );
    return null;
  }
}

/** API 型メタデータを保存 */
function writeApiTypesMetadata(
  dependencies: string[],
  outputs: string[]
): void {
  const metadata: ApiTypesMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(metadataDir, { recursive: true });
  writeFileSync(apiTypesMetadataPath, JSON.stringify(metadata, null, 2));
}

/** ファイルリストの差異を検出 */
function haveListsChanged(
  currentList: string[],
  previousList: string[]
): boolean {
  // 要素数が異なる場合は変更あり
  if (currentList.length !== previousList.length) {
    return true;
  }

  return currentList.some((value: string, index: number) => {
    return value !== previousList[index];
  });
}

/** 出力ディレクトリのファイル一覧を再帰的に収集 */
function collectOutputFiles(directory: string, baseDir: string): string[] {
  // 出力ディレクトリが存在しない場合は空配列
  if (!existsSync(directory)) {
    return [];
  }

  const entries: Dirent[] = readdirSync(directory, {
    withFileTypes: true,
  });
  const files: string[] = entries.flatMap((entry: Dirent) => {
    const entryPath: string = path.join(directory, entry.name);

    // ディレクトリは再帰的に収集
    if (entry.isDirectory()) {
      return collectOutputFiles(entryPath, baseDir);
    }

    return [path.relative(baseDir, entryPath).replace(/\\+/g, '/')];
  });

  files.sort();
  return files;
}

/** API 型生成が必要か判定 */
function shouldRegenerateApiTypes(): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const dependencyFiles: string[] = [generatorScriptPath, swaggerOutputPath];
  const normalizedDependencies: string[] = normalizePaths(dependencyFiles);
  const outputFiles: string[] = collectOutputFiles(
    apiClientOutputDir,
    projectRootDir
  );
  const normalizedOutputs: string[] = [...outputFiles];

  const metadata: ApiTypesMetadata | null = readApiTypesMetadata();

  // メタデータが存在しない場合は再生成
  if (metadata === null) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  // 依存ファイルが変化した場合は再生成
  if (haveListsChanged(normalizedDependencies, metadata.dependencies)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  // 期待する出力ファイルが変化した場合は再生成
  if (haveListsChanged(normalizedOutputs, metadata.outputs)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const expectedOutputPaths: string[] = normalizedOutputs.map(
    (relativePath: string) => {
      return path.join(projectRootDir, relativePath);
    }
  );

  // 出力ファイルが存在しない場合は再生成
  const hasMissingOutputs: boolean = expectedOutputPaths.some(
    (outputPath: string) => {
      return !existsSync(outputPath);
    }
  );

  // 出力が欠損している場合は再生成
  if (hasMissingOutputs) {
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

  const latestOutputMTime: number = expectedOutputPaths.reduce(
    (latest: number, filePath: string) => {
      const outputStat: number = statSync(filePath).mtimeMs;
      return Math.max(latest, outputStat);
    },
    0
  );

  // 依存の更新が出力より新しい場合は再生成
  if (latestDependencyMTime > latestOutputMTime) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate: false,
  };
}

/** API 型を生成するメイン処理 */
async function generateApiTypes(): Promise<void> {
  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateApiTypes();

  // 型が最新の場合はスキップ
  if (!regenerationAssessment.shouldRegenerate) {
    console.log('API types are up to date. Skipping regeneration.');
    return;
  }

  const generatorArguments: string[] = [
    'generate',
    '-p',
    swaggerOutputPath,
    '-o',
    apiClientOutputDir,
    '--name',
    'index.ts',
    '--extract-request-params',
    '--extract-request-body',
    '--extract-response-body',
    '--axios',
    '--disable-strict-ssl',
    '--disable-throw-on-error',
    '--clean-output',
  ];

  const cliExecutablePath: string = path.join(
    backendDir,
    'node_modules',
    '.bin',
    process.platform === 'win32'
      ? 'swagger-typescript-api.cmd'
      : 'swagger-typescript-api'
  );

  const generatorResult: SpawnSyncReturns<Buffer> = spawnSync(
    cliExecutablePath,
    generatorArguments,
    {
      cwd: backendDir,
      stdio: 'inherit',
    }
  );

  // コマンド実行時にエラーが発生した場合はそのまま投げる
  if (generatorResult.error !== undefined) {
    throw generatorResult.error;
  }

  // 生成コマンドが失敗した場合はエラーを投げる
  if (generatorResult.status !== 0) {
    throw new Error('swagger-typescript-api の実行に失敗しました。');
  }

  const refreshedOutputs: string[] = collectOutputFiles(
    apiClientOutputDir,
    projectRootDir
  );
  writeApiTypesMetadata(regenerationAssessment.dependencies, refreshedOutputs);
  console.log('API types generated successfully!');
}

generateApiTypes().catch((error: unknown) => {
  console.error('An error occurred while generating API types.', error);
  process.exit(1);
});
