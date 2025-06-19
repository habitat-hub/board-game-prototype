import { Metadata } from 'next';
import React from 'react';

import PrototypeList from '@/features/prototype/components/organisms/PrototypeList';

export const metadata: Metadata = {
  title: 'プロトタイプ一覧',
};

const GroupsPage: React.FC = () => {
  return <PrototypeList />;
};

export default GroupsPage;
