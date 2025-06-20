import { Metadata } from 'next';

import UserInvite from '@/features/prototype/components/organisms/UserInvite';

export const metadata: Metadata = {
  title: 'プロトタイプユーザー管理',
};

export const runtime = 'edge';
const InvitePage: React.FC = () => {
  return <UserInvite />;
};

export default InvitePage;
