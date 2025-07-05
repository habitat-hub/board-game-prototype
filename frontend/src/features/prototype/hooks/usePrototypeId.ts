import { useContext } from 'react';

import { PrototypeIdContext } from '@/features/prototype/contexts/PrototypeIdContext';

export const usePrototypeId = () => {
  const context = useContext(PrototypeIdContext);
  if (!context) {
    throw new Error('usePrototypeId must be used within a PrototypeIdProvider');
  }
  return context;
};
