import fs from 'fs';
import path from 'path';
import sequelizeErd from 'sequelize-erd';
import sequelize from './models'; // Sequelizeインスタンスをインポート
import { writeFileSync } from 'fs';

const modelsDir = path.join(__dirname, 'models');

(async function () {
  fs.readdirSync(modelsDir)
    .filter((file) => {
      return file.endsWith('.ts') && file !== 'index.ts';
    })
    .forEach((file) => {
      const modelModule = require(path.join(modelsDir, file));
      const model = modelModule.default;
      if (model && typeof model.initModel === 'function') {
        model.initModel(sequelize);
      }
    });

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
  writeFileSync('./erd.svg', svg);
  console.log('ERDが正常に生成されました！');
})();
