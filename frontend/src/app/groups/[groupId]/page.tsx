import { Metadata } from 'next';
import React from 'react';

import GroupPrototypeList from '@/features/prototype/components/organisms/GroupPrototypeList';

export const metadata: Metadata = {
  title: 'プロトタイプ管理',
};

export const runtime = 'edge';
const PrototypesPage: React.FC = () => {
  return <GroupPrototypeList />;
};

export default PrototypesPage;
