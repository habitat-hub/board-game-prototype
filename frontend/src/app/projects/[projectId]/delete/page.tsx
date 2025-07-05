import { Metadata } from 'next';
import React from 'react';

import DeletePrototypeConfirmation from '@/features/prototype/components/organisms/DeletePrototypeConfirmation';

export const metadata: Metadata = {
  title: 'プロトタイプ削除',
};

export const runtime = 'edge';
const DeletePrototypePage: React.FC = () => {
  return <DeletePrototypeConfirmation />;
};

export default DeletePrototypePage;
