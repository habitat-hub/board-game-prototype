# 将来の権限システム拡張例

## プロトタイプごとの権限管理

### 1. 実装例

```typescript
// プロトタイプ固有の権限付与
async function assignPrototypeRole(
  userId: string,
  prototypeId: string,
  roleType: 'admin' | 'editor' | 'player' | 'viewer'
) {
  const role = await RoleModel.findOne({ where: { name: roleType } });
  if (role) {
    await assignRole(userId, role.id, RESOURCE_TYPES.PROTOTYPE, prototypeId);
  }
}

// プロトタイプ固有の権限チェック
async function checkPrototypePermission(
  userId: string,
  prototypeId: string,
  action: string
): Promise<boolean> {
  return await hasPermission(userId, RESOURCE_TYPES.PROTOTYPE, action, prototypeId);
}
```

### 2. 使用シナリオ

```typescript
// ユーザーAに特定のプロトタイプの編集権限を付与
await assignPrototypeRole('user-a', 'prototype-123', 'editor');

// ユーザーBに特定のプロトタイプのプレイ権限のみ付与
await assignPrototypeRole('user-b', 'prototype-123', 'player');

// 権限チェック
const canEdit = await checkPrototypePermission('user-a', 'prototype-123', 'write');
const canPlay = await checkPrototypePermission('user-b', 'prototype-123', 'play');
```

### 3. 権限の階層

```
プロジェクトレベル (現在実装済み)
└── プロトタイプレベル (将来拡張)
    └── パーツレベル (さらなる将来拡張)
```

### 4. API拡張例

```typescript
// プロトタイプ固有の招待API
router.post('/:prototypeId/invite', async (req, res) => {
  const { prototypeId } = req.params;
  const { guestIds, roleType } = req.body;
  
  await Promise.all(
    guestIds.map(guestId => 
      assignPrototypeRole(guestId, prototypeId, roleType)
    )
  );
});

// プロトタイプ固有のアクセス制御ミドルウェア
export async function checkPrototypeAccess(req, res, next) {
  const userId = (req.user as UserModel).id;
  const prototypeId = req.params.prototypeId;
  
  const hasAccess = await checkPrototypePermission(userId, prototypeId, 'read');
  
  if (hasAccess) {
    return next();
  }
  
  res.status(403).json({ message: 'プロトタイプへのアクセス権がありません' });
}
```

### 5. 複合権限のシナリオ

```typescript
// ユーザーがプロジェクトの権限を持っていない場合でも、
// 特定のプロトタイプには権限を持つ場合
const hasGroupAccess = await hasPermission(userId, 'project', 'read', projectId);
const hasPrototypeAccess = await hasPermission(userId, 'prototype', 'read', prototypeId);

if (hasGroupAccess || hasPrototypeAccess) {
  // アクセス許可
}
```

## まとめ

現在の実装は既に**完全に柔軟性を持った設計**になっており、追加のテーブル変更なしに：

✅ プロジェクトごとの権限（現在実装済み）
✅ プロトタイプごとの権限（拡張可能）
✅ ユーザーごとの権限（拡張可能）
✅ その他任意のリソースごとの権限（拡張可能）

が全て実現できます。
