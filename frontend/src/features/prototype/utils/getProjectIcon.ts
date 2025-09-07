import { IconType } from 'react-icons';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';

/**
 * Returns a stable icon component for a given project/prototype ID.
 * The selection is deterministic based on the ID to provide consistency
 * across different views without persisting additional state.
 */
export function getProjectIcon(id: string): IconType {
  const icons: IconType[] = [GiWoodenCrate, GiCardAceSpades, GiPuzzle];
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return icons[hash % icons.length];
}
