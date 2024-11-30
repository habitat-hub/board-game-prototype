'use client';

import CreatePrototypeForm from '@/features/prototype/components/organisms/CreatePrototypeFrom';
import React from 'react';
import { withAuth } from '@/app/components/withAuth';

const CreatePrototypePage: React.FC = () => {
  return (
    <div>
      <CreatePrototypeForm />
    </div>
  );
};

export default withAuth(CreatePrototypePage);
