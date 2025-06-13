import { Metadata } from 'next';
import React from 'react';

import PrototypeEdit from '@/features/prototype/components/organisms/PrototypeEdit';

export const metadata: Metadata = {
  title: 'プロトタイプ編集',
};

export const runtime = 'edge';
const PrototypesEditPage: React.FC = () => {
  return <PrototypeEdit />;
};

export default PrototypesEditPage;
