import fs from 'fs';
import path from 'path';
import { Model, ModelStatic, DataTypes } from 'sequelize';

const modelsDir = path.join(__dirname, '../models');
const outputPath = path.join(
  __dirname,
  '../../../frontend/src/types/models.ts'
);

// カスタム型定義ファイルの内容を読み込む
const customTypesPath = path.join(__dirname, '../types/custom.d.ts');
const customTypes = fs.readFileSync(customTypesPath, 'utf8');

// JSONTypeMapの定義を抽出
const jsonTypeMapMatch = customTypes.match(
  /export\s+interface\s+JSONTypeMap\s*{([\s\S]*)}/
);
const jsonTypeMapContent = jsonTypeMapMatch ? jsonTypeMapMatch[1] : '';

// ユーティリティ型の定義
const utilityTypes = `// This file is auto-generated. DO NOT EDIT.

type JSONField<TableName extends string, ColumnName extends string> = 
  TableName extends keyof JSONTypeMap 
    ? ColumnName extends keyof JSONTypeMap[TableName]
      ? JSONTypeMap[TableName][ColumnName]
      : Record<string, unknown>
    : Record<string, unknown>;

interface JSONTypeMap {${jsonTypeMapContent}}

`;

function getTypeScriptType(
  sequelizeType: any,
  tableName: string,
  fieldName: string
): string {
  const type = sequelizeType.toString().toLowerCase();

  if (sequelizeType instanceof DataTypes.ENUM) {
    const enumType = sequelizeType as unknown as { values: string[] };
    return enumType.values.map((v) => `'${v}'`).join(' | ');
  }

  if (
    sequelizeType instanceof DataTypes.JSON ||
    sequelizeType instanceof DataTypes.JSONB
  ) {
    return `JSONField<'${tableName}', '${fieldName}'>`;
  }

  if (type.includes('[]')) {
    const arrayType = sequelizeType as unknown as { type: any };
    if (arrayType.type) {
      const elementType = getTypeScriptType(
        arrayType.type,
        tableName,
        fieldName
      );
      return `${elementType}[]`;
    }
    const match = type.match(/array<(.*?)>/i);
    if (match) {
      const elementType = getTypeScriptType(
        { toString: () => match[1] },
        tableName,
        fieldName
      );
      return `${elementType}[]`;
    }
    return 'any[]';
  }

  if (type.includes('json')) {
    if (sequelizeType.options?.type) {
      return sequelizeType.options.type;
    }
    return 'Record<string, unknown>';
  }

  if (
    sequelizeType instanceof DataTypes.INTEGER ||
    sequelizeType instanceof DataTypes.BIGINT ||
    sequelizeType instanceof DataTypes.FLOAT ||
    sequelizeType instanceof DataTypes.DOUBLE
  ) {
    return 'number';
  }

  if (
    sequelizeType instanceof DataTypes.STRING ||
    sequelizeType instanceof DataTypes.TEXT ||
    sequelizeType instanceof DataTypes.UUID
  ) {
    return 'string';
  }

  if (sequelizeType instanceof DataTypes.BOOLEAN) {
    return 'boolean';
  }

  if (sequelizeType instanceof DataTypes.DATE) {
    // NOTE: 日付型はstringで表現する
    return 'string';
  }

  console.warn(`Unknown type: ${type}, using 'any'`);
  return 'any';
}

function generateTypeDefinition(model: ModelStatic<Model>) {
  const attributes = model.getAttributes();
  const defaultScope =
    (model as any).options?.defaultScope?.attributes?.exclude || [];
  let typeDefinition = `export interface ${model.name} {\n`;

  for (const [key, attribute] of Object.entries(attributes)) {
    if (defaultScope.includes(key)) continue;

    const tsType = getTypeScriptType(
      attribute.type,
      model.name.toLowerCase(),
      key
    );
    typeDefinition += `  ${key}${attribute.allowNull ? '?' : ''}: ${tsType};\n`;
  }

  typeDefinition += '}\n\n';
  return typeDefinition;
}

(async function () {
  let output = utilityTypes;

  fs.readdirSync(modelsDir)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .forEach((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modelModule = require(path.join(modelsDir, file));
      const model = modelModule.default;
      if (model) {
        output += generateTypeDefinition(model);
      }
    });
  fs.writeFileSync(outputPath, output);
  console.log('✨ Type definitions generated successfully!');
})();
