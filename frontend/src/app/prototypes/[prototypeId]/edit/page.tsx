import React from 'react';
import { Metadata } from 'next';
import PrototypeComponent from '@/features/prototype/components/organisms/Prototype';
import { VIEW_MODE } from '@/features/prototype/const';

export const metadata: Metadata = {
  title: 'プロトタイプ編集',
};

export const runtime = 'edge';
const EditPrototypePage: React.FC = () => {
  return <PrototypeComponent viewMode={VIEW_MODE.EDIT} />;
};

export default EditPrototypePage;
