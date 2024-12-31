// This file is auto-generated. DO NOT EDIT.

export interface Access {
  id: number;
  prototypeGroupId: string;
  name: string;
}

export interface Part {
  id: number;
  type: string;
  prototypeVersionId: string;
  parentId?: number;
  name: string;
  description: string;
  color: string;
  position: Record<string, unknown>;
  width: number;
  height: number;
  order: number;
  configurableTypeAsChild: string[];
  originalPartId?: number;
  isReversible?: boolean;
  isFlipped?: boolean;
  ownerId?: number;
  canReverseCardOnDeck?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: number;
  prototypeVersionId: string;
  userId?: string;
  playerName: string;
  originalPlayerId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Prototype {
  id: string;
  userId: string;
  name: string;
  type: 'EDIT' | 'PREVIEW';
  masterPrototypeId?: string;
  groupId: string;
  minPlayers: number;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrototypeGroup {
  id: string;
  prototypeId: string;
}

export interface PrototypeVersion {
  id: string;
  prototypeId: string;
  versionNumber: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccess {
  userId: string;
  accessId: number;
}

