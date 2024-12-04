import React from 'react';
import { Metadata } from 'next';
import CreatePrototypeForm from '@/features/prototype/components/organisms/CreatePrototypeFrom';

export const metadata: Metadata = {
  title: 'プロトタイプ作成',
};

const CreatePrototypePage: React.FC = () => {
  return (
    <div>
      <CreatePrototypeForm />
    </div>
  );
};

export default CreatePrototypePage;
