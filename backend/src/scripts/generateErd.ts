import path from 'path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'fs';
import sequelizeErd from 'sequelize-erd';
import sequelize from '../models'; // Sequelizeインスタンスをインポート
import { setupAssociations } from '../database/associations'; // アソシエーション設定をインポート

const repoRootDir: string = path.resolve(__dirname, '..', '..', '..');
const modelsDir = path.join(__dirname, '../models');
const backendRootDir = path.resolve(__dirname, '..', '..');
const erdOutputPath = path.join(backendRootDir, 'erd.svg');
const associationsFilePath = path.join(
  __dirname,
  '../database/associations.ts'
);
const metadataDir = path.join(backendRootDir, 'src', 'scripts', 'metadata');
const erdMetadataPath = path.join(metadataDir, 'erd.json');
const generatorScriptPath = __filename;

interface ErdMetadata {
  dependencies: string[];
  outputs: string[];
}

function normalizeDependencies(filePaths: string[]): string[] {
  const normalizedPaths: string[] = filePaths
    .map((filePath: string) => {
      return path.relative(repoRootDir, filePath).replace(/\\+/g, '/');
    })
    .sort();

  return normalizedPaths;
}

function readErdMetadata(): ErdMetadata | null {
  if (!existsSync(erdMetadataPath)) {
    return null;
  }

  try {
    const metadataRaw: string = readFileSync(erdMetadataPath, 'utf-8');
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

    const dependencies: string[] = (
      parsedMetadata as { dependencies: string[] }
    ).dependencies;
    const outputs: string[] = (parsedMetadata as { outputs: string[] }).outputs;
    return {
      dependencies,
      outputs,
    };
  } catch (error) {
    console.warn('Failed to read ERD metadata. Regenerating artifact.', error);
    return null;
  }
}

function writeErdMetadata(dependencies: string[], outputs: string[]): void {
  const metadata: ErdMetadata = {
    dependencies,
    outputs,
  };

  mkdirSync(metadataDir, { recursive: true });
  writeFileSync(erdMetadataPath, JSON.stringify(metadata, null, 2));
}

function haveDependenciesChanged(
  currentDependencies: string[],
  previousDependencies: string[]
): boolean {
  if (currentDependencies.length !== previousDependencies.length) {
    return true;
  }

  return currentDependencies.some((dependency: string, index: number) => {
    return dependency !== previousDependencies[index];
  });
}

function shouldRegenerateErd(modelFileNames: string[]): {
  dependencies: string[];
  outputs: string[];
  shouldRegenerate: boolean;
} {
  const dependencyFiles: string[] = [
    generatorScriptPath,
    associationsFilePath,
    ...modelFileNames.map((fileName: string) => {
      return path.join(modelsDir, fileName);
    }),
  ];

  const normalizedDependencies: string[] =
    normalizeDependencies(dependencyFiles);
  const normalizedOutputs: string[] = normalizeDependencies([erdOutputPath]);

  if (!existsSync(erdOutputPath)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const existingMetadata: ErdMetadata | null = readErdMetadata();

  if (existingMetadata === null) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  if (
    haveDependenciesChanged(
      normalizedDependencies,
      existingMetadata.dependencies
    )
  ) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  if (haveDependenciesChanged(normalizedOutputs, existingMetadata.outputs)) {
    return {
      dependencies: normalizedDependencies,
      outputs: normalizedOutputs,
      shouldRegenerate: true,
    };
  }

  const erdStat = statSync(erdOutputPath);
  let latestDependencyMTime = 0;

  dependencyFiles.forEach((filePath: string) => {
    if (!existsSync(filePath)) {
      return;
    }

    const fileStat = statSync(filePath);
    latestDependencyMTime = Math.max(latestDependencyMTime, fileStat.mtimeMs);
  });

  const shouldRegenerate: boolean = latestDependencyMTime > erdStat.mtimeMs;

  return {
    dependencies: normalizedDependencies,
    outputs: normalizedOutputs,
    shouldRegenerate,
  };
}

/** ERD を生成するメイン処理 */
async function generateErd(): Promise<void> {
  const modelFileNames: string[] = readdirSync(modelsDir).filter(
    (file: string): boolean => {
      return file.endsWith('.ts');
    }
  );

  const regenerationAssessment: {
    dependencies: string[];
    outputs: string[];
    shouldRegenerate: boolean;
  } = shouldRegenerateErd(modelFileNames);

  // ERD が最新の場合はスキップ
  if (!regenerationAssessment.shouldRegenerate) {
    console.log('ERD is up to date. Skipping regeneration.');
    return;
  }

  modelFileNames
    .filter((file: string) => {
      return file !== 'index.ts';
    })
    .forEach((file: string) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modelModule = require(path.join(modelsDir, file));
      const model = modelModule.default;
      if (model && typeof model.initModel === 'function') {
        model.initModel(sequelize);
      }
    });

  // アソシエーションを設定
  setupAssociations();

  const svg = await sequelizeErd({
    source: sequelize,
    arrowShapes: {
      BelongsToMany: ['crow', 'crow'],
      BelongsTo: ['inv', 'crow'],
      HasMany: ['crow', 'inv'],
      HasOne: ['dot', 'dot'],
    },
    engine: 'dot',
    arrowSize: 1.2,
    lineWidth: 1,
    color: 'blue',
  });

  writeFileSync(erdOutputPath, svg);
  writeErdMetadata(
    regenerationAssessment.dependencies,
    regenerationAssessment.outputs
  );
  console.log('ERD generated successfully!');
}

generateErd().catch((error) => {
  console.error('An error occurred while generating the ERD.', error);
  process.exit(1);
});
