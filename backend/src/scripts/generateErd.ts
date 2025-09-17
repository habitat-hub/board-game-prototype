import path from 'path';
import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import sequelizeErd from 'sequelize-erd';
import sequelize from '../models'; // Sequelizeインスタンスをインポート
import { setupAssociations } from '../database/associations'; // アソシエーション設定をインポート

const modelsDir = path.join(__dirname, '../models');
const backendRootDir = path.resolve(__dirname, '..', '..');
const erdOutputPath = path.join(backendRootDir, 'erd.svg');
const associationsFilePath = path.join(
  __dirname,
  '../database/associations.ts'
);

function shouldRegenerateErd(modelFileNames: string[]): boolean {
  if (!existsSync(erdOutputPath)) {
    return true;
  }

  const dependencyFiles = [
    associationsFilePath,
    ...modelFileNames.map((fileName) => {
      return path.join(modelsDir, fileName);
    }),
  ];

  const erdStat = statSync(erdOutputPath);
  let latestDependencyMTime = 0;

  dependencyFiles.forEach((filePath) => {
    if (!existsSync(filePath)) {
      return;
    }

    const fileStat = statSync(filePath);
    latestDependencyMTime = Math.max(latestDependencyMTime, fileStat.mtimeMs);
  });

  return latestDependencyMTime > erdStat.mtimeMs;
}

/** ERD を生成するメイン処理 */
async function generateErd(): Promise<void> {
  const modelFileNames: string[] = readdirSync(modelsDir).filter(
    (file: string): boolean => {
      return file.endsWith('.ts');
    }
  );

  // ERD が最新の場合はスキップ
  if (!shouldRegenerateErd(modelFileNames)) {
    console.log('ERDは最新の状態です。再生成をスキップします。');
    return;
  }

  modelFileNames
    .filter((file) => {
      return file !== 'index.ts';
    })
    .forEach((file) => {
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
  console.log('ERDが正常に生成されました！');
}

generateErd().catch((error) => {
  console.error('ERDの生成中にエラーが発生しました。', error);
  process.exit(1);
});
