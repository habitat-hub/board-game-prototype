import { Metadata } from 'next';

import RoleDetails from '@/features/prototype/components/organisms/RoleDetails';

export const metadata: Metadata = {
  title: 'ロール詳細',
};

export const runtime = 'edge';
const RoleDetailsPage: React.FC = () => {
  return <RoleDetails />;
};

export default RoleDetailsPage;
