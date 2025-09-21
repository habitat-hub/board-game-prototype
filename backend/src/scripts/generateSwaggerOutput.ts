import path from 'path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import type { Dirent, Stats } from 'fs';
import swaggerJsdoc from 'swagger-jsdoc';
import { buildSwaggerOptions } from '../config/swaggerOptions';

// バックエンドのルートディレクトリ
const BACKEND_ROOT_DIR: string = path.resolve(__dirname, '..', '..');
// ルート定義ファイルを格納するディレクトリ
const ROUTES_DIR: string = path.join(BACKEND_ROOT_DIR, 'src', 'routes');
// 生成する Swagger 出力ファイルのパス
const SWAGGER_OUTPUT_PATH: string = path.join(
  BACKEND_ROOT_DIR,
  '__generated__',
  'swagger-output.json'
);
// Swagger メタデータの保存先ディレクトリ
const METADATA_DIR: string = path.join(
  BACKEND_ROOT_DIR,
  'src',
  'scripts',
  '__generated__'
);
// Swagger 出力の依存関係メタデータのパス
const SWAGGER_METADATA_PATH: string = path.join(
  METADATA_DIR,
  'swagger-output-metadata.json'
);
// Swagger スキーマ定義ファイルのパス
const SWAGGER_SCHEMAS_PATH: string = path.join(
  BACKEND_ROOT_DIR,
  'src',
  '__generated__',
  'swagger-schemas.ts'
);
// Swagger オプション定義ファイルのパス
const SWAGGER_OPTIONS_PATH: string = path.join(
  BACKEND_ROOT_DIR,
  'src',
  'config',
  'swaggerOptions.ts'
);
// このスクリプト自身のパス（依存関係として追跡）
const GENERATOR_SCRIPT_PATH: string = __filename;

interface SwaggerOutputMetadata {
  dependencies: string[];
  outputs: string[];
}

/**
 * ファイルパス配列をルートからの相対パスへ正規化してソートする。
 * - Windows パス区切りも `/` へ置換する。
 * @param filePaths 正規化対象のファイルパス配列
 * @returns 正規化後に昇順ソートしたパス配列
 */
function normalizePaths(filePaths: string[]): string[] {
  return filePaths
    .map((filePath: string) => {
      return path.relative(BACKEND_ROOT_DIR, filePath).replace(/\\+/g, '/');
    })
    .sort();
}

/**
 * Swagger 出力に関する依存メタデータを読み込む。
 * - JSON が不正な場合は再生成を促すため null を返す。
 * @returns メタデータまたは未取得を示す null
 */
function readMetadata(): SwaggerOutputMetadata | null {
  // メタデータファイルが存在しない場合の早期リターン
  if (!existsSync(SWAGGER_METADATA_PATH)) {
    return null;
  }

  try {
    const metadataRaw: string = readFileSync(SWAGGER_METADATA_PATH, 'utf-8');
    const parsedMetadata: unknown = JSON.parse(metadataRaw);

    // 期待する配列構造でない場合は再生成を促す
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

/**
 * 最新の依存および成果物情報をメタデータとして保存する。
 * @param dependencies 正規化済み依存ファイルパス一覧
 * @param outputs 正規化済み成果物ファイルパス一覧
 */
function writeMetadata(dependencies: string[], outputs: string[]): void {
  const metadata: SwaggerOutputMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(METADATA_DIR, { recursive: true });
  writeFileSync(SWAGGER_METADATA_PATH, JSON.stringify(metadata, null, 2));
}

/**
 * ルートディレクトリ配下から `.ts` ファイルのルート定義を再帰的に収集する。
 * @param directory 探索対象ディレクトリ
 * @returns 収集したファイルパス一覧
 */
function collectRouteFiles(directory: string): string[] {
  // パスが存在しない場合は空配列を返す
  if (!existsSync(directory)) {
    return [];
  }

  const entries: Dirent[] = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry: Dirent) => {
    const entryPath: string = path.join(directory, entry.name);

    // ディレクトリは再帰的に探索する
    if (entry.isDirectory()) {
      return collectRouteFiles(entryPath);
    }

    // TypeScript ファイル以外は対象外とする
    if (!entry.name.endsWith('.ts')) {
      return [];
    }

    if (/\.(test|spec)\.ts$/u.test(entry.name)) {
      return [];
    }

    return [entryPath];
  });
}

/**
 * 2 つの文字列配列が順序含め一致するかを判定する。
 * @param currentList 新しいリスト
 * @param previousList 比較対象の既存リスト
 * @returns 差分がある場合は true
 */
function haveListsChanged(
  currentList: string[],
  previousList: string[]
): boolean {
  // 要素数が異なる場合
  if (currentList.length !== previousList.length) {
    return true;
  }

  return currentList.some((value: string, index: number) => {
    return value !== previousList[index];
  });
}

/**
 * Swagger 出力の再生成が必要かを判定する。
 * - 依存ファイルと出力ファイルのメタデータ差分と更新時刻を比較する。
 * @returns 判定結果（依存/成果物リストと再生成フラグ）
 */
function shouldRegenerateSwaggerOutput(): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const routeFiles: string[] = collectRouteFiles(ROUTES_DIR);
  const dependencyFiles: string[] = [
    GENERATOR_SCRIPT_PATH,
    SWAGGER_SCHEMAS_PATH,
    SWAGGER_OPTIONS_PATH,
    ...routeFiles,
  ];

  const normalizedDependencies: string[] = normalizePaths(dependencyFiles);
  const outputFiles: string[] = [SWAGGER_OUTPUT_PATH];
  const normalizedOutputs: string[] = normalizePaths(outputFiles);

  // 出力が未作成の場合
  if (!existsSync(SWAGGER_OUTPUT_PATH)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const metadata: SwaggerOutputMetadata | null = readMetadata();

  // メタデータがない/壊れている場合
  if (metadata === null) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  // 依存リストに差分がある場合
  if (haveListsChanged(normalizedDependencies, metadata.dependencies)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  // 出力リストに差分がある場合
  if (haveListsChanged(normalizedOutputs, metadata.outputs)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const latestDependencyMTime: number = dependencyFiles.reduce(
    (latest: number, filePath: string) => {
      // ファイルが存在しない場合はスキップ
      if (!existsSync(filePath)) {
        return latest;
      }
      try {
        const fileStat: Stats = statSync(filePath);
        const mtime: number = fileStat.mtimeMs;

        return Math.max(latest, mtime);
      } catch (error: unknown) {
        console.debug(
          `Failed to stat dependency file: ${filePath}. Forcing regeneration.`,
          error
        );
        return Number.POSITIVE_INFINITY;
      }
    },
    0
  );
  let outputMtime: number;
  try {
    const outputStat: Stats = statSync(SWAGGER_OUTPUT_PATH);
    outputMtime = outputStat.mtimeMs;
  } catch (error: unknown) {
    console.debug(
      `Failed to stat Swagger output at ${SWAGGER_OUTPUT_PATH}. Regeneration required.`,
      error
    );
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const shouldRegenerate: boolean = latestDependencyMTime > outputMtime;

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate,
  };
}

/**
 * Swagger 定義ファイルの生成を行い、メタデータを更新する。
 * - 再生成が不要な場合はスキップする。
 * @returns Promise<void>
 */
async function generateSwaggerOutput(): Promise<void> {
  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateSwaggerOutput();

  // 再生成が不要と判定された場合
  if (!regenerationAssessment.shouldRegenerate) {
    console.log('Swagger output is up to date. Skipping regeneration.');
    return;
  }

  const swaggerSpec = swaggerJsdoc(buildSwaggerOptions());
  mkdirSync(path.dirname(SWAGGER_OUTPUT_PATH), { recursive: true });
  writeFileSync(SWAGGER_OUTPUT_PATH, JSON.stringify(swaggerSpec, null, 2));
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
