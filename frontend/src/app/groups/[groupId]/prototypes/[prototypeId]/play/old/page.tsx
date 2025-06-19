import { Metadata } from 'next';
import React from 'react';

import PrototypePlayOld from '@/features/prototype/components/organisms/PrototypePlayOld';

export const metadata: Metadata = {
  title: 'プレイ',
};

export const runtime = 'edge';

const PrototypesPreviewPage: React.FC = () => {
  return <PrototypePlayOld />;
};

export default PrototypesPreviewPage;
