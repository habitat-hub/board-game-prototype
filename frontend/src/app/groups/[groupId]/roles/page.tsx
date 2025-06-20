import { Metadata } from 'next';

import RoleManagement from '@/features/prototype/components/organisms/RoleManagement';

export const metadata: Metadata = {
  title: 'ロール管理',
};

export const runtime = 'edge';
const RolesPage: React.FC = () => {
  return <RoleManagement />;
};

export default RolesPage;
