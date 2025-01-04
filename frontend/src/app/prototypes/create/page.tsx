import { Metadata } from 'next';
import React from 'react';

import CreatePrototypeForm from '@/features/prototype/components/organisms/CreatePrototypeFrom';

export const metadata: Metadata = {
  title: 'プロトタイプ作成',
};

const CreatePrototypePage: React.FC = () => {
  return <CreatePrototypeForm />;
};

export default CreatePrototypePage;
