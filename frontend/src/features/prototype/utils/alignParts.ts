import { Part } from '@/api/types';
import {
  UpdatePartPayload,
  UpdatePartsAction,
} from '@/features/prototype/types/socket';

export type AlignDirection =
  | 'left'
  | 'center'
  | 'right'
  | 'top'
  | 'middle'
  | 'bottom';

export function createAlignPartsAction({
  parts,
  targetIds,
  referenceId,
  direction,
}: {
  parts: Part[];
  targetIds: number[];
  referenceId: number;
  direction: AlignDirection;
}): UpdatePartsAction | null {
  const reference = parts.find((p) => p.id === referenceId);
  if (!reference) return null;

  const updates: UpdatePartPayload[] = targetIds
    .filter((id) => id !== referenceId)
    .map((id) => {
      const part = parts.find((p) => p.id === id);
      if (!part) return null;

      const position = { ...part.position } as { x: number; y: number };

      switch (direction) {
        case 'left':
          position.x = reference.position.x;
          break;
        case 'center':
          position.x =
            reference.position.x + reference.width / 2 - part.width / 2;
          break;
        case 'right':
          position.x =
            reference.position.x + reference.width - part.width;
          break;
        case 'top':
          position.y = reference.position.y;
          break;
        case 'middle':
          position.y =
            reference.position.y + reference.height / 2 - part.height / 2;
          break;
        case 'bottom':
          position.y =
            reference.position.y + reference.height - part.height;
          break;
      }

      return { partId: id, updatePart: { position } } as UpdatePartPayload;
    })
    .filter((u): u is UpdatePartPayload => u !== null);

  if (updates.length === 0) return null;

  return { type: 'UPDATE_PARTS', payload: { updates } };
}

