import React from 'react';
import { Metadata } from 'next';

import PrototypeEdit from '@/features/prototype/components/organisms/PrototypeEdit';

export const metadata: Metadata = {
  title: 'プロトタイプ編集',
};

const PrototypesEditPage: React.FC = () => {
  return <PrototypeEdit />;
};

export default PrototypesEditPage;
