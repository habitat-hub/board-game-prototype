// This file is auto-generated. DO NOT EDIT.

export const swaggerSchemas = {
  components: {
    schemas: {
      ...{
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
      },
      Image: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          displayName: {
            type: 'string',
          },
          storagePath: {
            type: 'string',
          },
          contentType: {
            type: 'string',
          },
          fileSize: {
            type: 'integer',
          },
          uploaderUserId: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: [
          'id',
          'displayName',
          'storagePath',
          'contentType',
          'fileSize',
          'uploaderUserId',
          'createdAt',
          'updatedAt',
        ],
      },
      Part: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          type: {
            type: 'string',
            enum: ['token', 'card', 'hand', 'deck', 'area'],
          },
          prototypeId: {
            type: 'string',
            format: 'uuid',
          },
          position: {
            type: 'object',
            additionalProperties: true,
          },
          width: {
            type: 'integer',
          },
          height: {
            type: 'integer',
          },
          order: {
            type: 'integer',
          },
          frontSide: {
            oneOf: [
              {
                type: 'string',
                enum: ['front', 'back'],
              },
              {
                type: 'null',
              },
            ],
          },
          ownerId: {
            oneOf: [
              {
                type: 'string',
                format: 'uuid',
              },
              {
                type: 'null',
              },
            ],
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: [
          'id',
          'type',
          'prototypeId',
          'position',
          'width',
          'height',
          'order',
          'createdAt',
          'updatedAt',
        ],
      },
      PartProperty: {
        type: 'object',
        properties: {
          partId: {
            type: 'integer',
          },
          side: {
            type: 'string',
            enum: ['front', 'back'],
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          color: {
            type: 'string',
          },
          textColor: {
            type: 'string',
          },
          imageId: {
            oneOf: [
              {
                type: 'string',
                format: 'uuid',
              },
              {
                type: 'null',
              },
            ],
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: [
          'partId',
          'side',
          'name',
          'description',
          'color',
          'textColor',
          'createdAt',
          'updatedAt',
        ],
      },
      Permission: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
          resource: {
            type: 'string',
          },
          action: {
            type: 'string',
          },
          description: {
            oneOf: [
              {
                type: 'string',
              },
              {
                type: 'null',
              },
            ],
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: [
          'id',
          'name',
          'resource',
          'action',
          'createdAt',
          'updatedAt',
        ],
      },
      Project: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: ['id', 'userId', 'createdAt', 'updatedAt'],
      },
      Prototype: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          projectId: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['MASTER', 'VERSION', 'INSTANCE'],
          },
          sourceVersionPrototypeId: {
            oneOf: [
              {
                type: 'string',
                format: 'uuid',
              },
              {
                type: 'null',
              },
            ],
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: ['id', 'projectId', 'name', 'type', 'createdAt', 'updatedAt'],
      },
      Role: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          name: {
            type: 'string',
          },
          description: {
            oneOf: [
              {
                type: 'string',
              },
              {
                type: 'null',
              },
            ],
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: ['id', 'name', 'createdAt', 'updatedAt'],
      },
      RolePermission: {
        type: 'object',
        properties: {
          roleId: {
            type: 'integer',
          },
          permissionId: {
            type: 'integer',
          },
        },
        required: ['roleId', 'permissionId'],
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          username: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: ['id', 'username', 'createdAt', 'updatedAt'],
      },
      UserRole: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          roleId: {
            type: 'integer',
          },
          resourceType: {
            type: 'string',
          },
          resourceId: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
          },
          updatedAt: {
            type: 'string',
          },
        },
        required: [
          'id',
          'userId',
          'roleId',
          'resourceType',
          'resourceId',
          'createdAt',
          'updatedAt',
        ],
      },
    },
  },
};
