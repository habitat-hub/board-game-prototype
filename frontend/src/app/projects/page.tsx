import { Metadata } from 'next';
import React from 'react';

import ProjectList from '@/features/prototype/components/organisms/ProjectList';

export const metadata: Metadata = {
  title: 'プロトタイプ一覧',
};

const ProjectsPage: React.FC = () => {
  return <ProjectList />;
};

export default ProjectsPage;
