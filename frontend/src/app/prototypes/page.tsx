'use client';

import PrototypeList from '@/features/prototype/components/organisms/PrototypeList';
import React from 'react';
import { withAuth } from '@/app/components/withAuth';

const PrototypesPage: React.FC = () => {
  return (
    <div>
      <PrototypeList />
    </div>
  );
};

export default withAuth(PrototypesPage);
