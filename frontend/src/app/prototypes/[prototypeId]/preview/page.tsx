import React from 'react';
import { Metadata } from 'next';
import PrototypeComponent from '@/features/prototype/components/organisms/Prototype';
import { VIEW_MODE } from '@/features/prototype/const';

export const metadata: Metadata = {
  title: 'プレビュー版プレイ',
};

export const runtime = 'edge';
const PreviewPrototypePage: React.FC = () => {
  return <PrototypeComponent viewMode={VIEW_MODE.PREVIEW} />;
};

export default PreviewPrototypePage;
