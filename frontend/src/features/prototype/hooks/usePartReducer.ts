import { useReducer } from 'react';

import { usePrototypeVersionId } from '@/features/prototype/hooks/usePrototypeVersionId';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { createPartReducer } from '@/features/prototype/reducers/partReducer';

export const usePartReducer = () => {
  const { socket } = useSocket();
  const { prototypeVersionId } = usePrototypeVersionId();

  const [state, dispatch] = useReducer(
    createPartReducer(socket, prototypeVersionId),
    undefined
  );
  return {
    state,
    dispatch,
  };
};
