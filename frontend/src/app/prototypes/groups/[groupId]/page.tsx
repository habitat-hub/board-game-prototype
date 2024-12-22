import React from 'react';
import { Metadata } from 'next';

import GroupPrototypeList from '@/features/prototype/components/organisms/GroupPrototypeList';

export const metadata: Metadata = {
  title: 'グループプロトタイプ一覧',
};

const PrototypesPage: React.FC = () => {
  return (
    <div>
      <GroupPrototypeList />
    </div>
  );
};

export default PrototypesPage;
