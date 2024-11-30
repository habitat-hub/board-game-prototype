'use client';

import React from 'react';
import { withAuth } from '@/app/components/withAuth';
import PrototypeComponent from '@/features/prototype/components/organisms/Prototype';
import { VIEW_MODE } from '@/features/prototype/const';

export const runtime = 'edge';
const EditPrototypePage: React.FC = () => {
  return <PrototypeComponent viewMode={VIEW_MODE.EDIT} />;
};

export default withAuth(EditPrototypePage);
