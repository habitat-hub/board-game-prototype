import { Metadata } from 'next';

import RoleManagement from '@/features/role/components/organisms/RoleManagement';

export const metadata: Metadata = {
  title: '権限設定',
};

export const runtime = 'edge';
const RolesPage: React.FC = () => {
  return <RoleManagement />;
};

export default RolesPage;
