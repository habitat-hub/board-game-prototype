/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import { Model, ModelStatic, DataTypes } from 'sequelize';

const modelsDir = path.join(__dirname, '../models');
const outputPath = path.join(__dirname, '../swagger-schemas.ts');

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

function getSwaggerType(sequelizeType: any, allowNull: boolean = false): any {
  const type = sequelizeType.toString().toLowerCase();

  let swaggerType: any;

  if (sequelizeType instanceof DataTypes.ENUM) {
    swaggerType = {
      type: 'string',
      enum: (sequelizeType as any).values,
    };
  } else if (sequelizeType instanceof DataTypes.ARRAY) {
    const itemType = getSwaggerType((sequelizeType as any).type);
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

  // allowNullがtrueの場合、nullを許容する型を返す
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
    (model as any).options?.defaultScope?.attributes?.exclude || [];
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, attribute] of Object.entries(attributes)) {
    // defaultScopeで除外されている属性はスキップ
    if (defaultScope.includes(key)) continue;

    if (key.startsWith('_')) continue;

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

(async function () {
  let output = `// This file is auto-generated. DO NOT EDIT.
/* eslint-disable */
export const swaggerSchemas = {
  components: {
    schemas: {
      ...${JSON.stringify(commonSchemas, null, 6)},`;

  fs.readdirSync(modelsDir)
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

  fs.writeFileSync(outputPath, output);
  console.log('✨ Swagger schemas generated successfully!');
})();
