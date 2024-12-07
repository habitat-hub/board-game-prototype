import React from 'react';
import { Metadata } from 'next';

import PrototypeComponent from '@/features/prototype/components/organisms/Prototype';
import { VIEW_MODE } from '@/features/prototype/const';

export const metadata: Metadata = {
  title: '公開版プレイ',
};

export const runtime = 'edge';
const PublishedPrototypePage: React.FC = () => {
  return <PrototypeComponent viewMode={VIEW_MODE.PUBLIC} />;
};

export default PublishedPrototypePage;
