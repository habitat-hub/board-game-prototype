import { useReducer } from 'react';

import { usePrototype } from '@/features/prototype/contexts/PrototypeContext';
import { createPartReducer } from '@/features/prototype/reducers/partReducer';

export const usePartReducer = () => {
  const { socket, prototypeVersionId } = usePrototype();

  const [state, dispatch] = useReducer(
    createPartReducer(socket, prototypeVersionId),
    undefined
  );
  return {
    state,
    dispatch,
  };
};
