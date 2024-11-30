'use client';

import React from 'react';
import { withAuth } from '@/app/components/withAuth';

import PrototypeComponent from '@/features/prototype/components/organisms/Prototype';
import { VIEW_MODE } from '@/features/prototype/const';

const PublishedPrototypePage: React.FC = () => {
  return <PrototypeComponent viewMode={VIEW_MODE.PUBLIC} />;
};

export default withAuth(PublishedPrototypePage);
