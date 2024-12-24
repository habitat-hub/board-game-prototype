import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プレイ',
};

export const runtime = 'edge';
const PrototypesPreviewPage: React.FC = () => {
  return <div>プレイ</div>;
};

export default PrototypesPreviewPage;
