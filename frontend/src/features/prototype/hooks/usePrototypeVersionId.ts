import { useContext } from 'react';

import { PrototypeVersionIdContext } from '@/features/prototype/contexts/PrototypeVersionIdContext';

export const usePrototypeVersionId = () => {
  const context = useContext(PrototypeVersionIdContext);
  if (!context) {
    throw new Error(
      'usePrototypeVersionId must be used within a PrototypeVersionIdProvider'
    );
  }
  return context;
};
