import { Metadata } from 'next';
import PlayerInvite from '@/features/prototype/components/organisms/PlayerInvite';

export const metadata: Metadata = {
  title: 'プレイヤー招待',
};

export const runtime = 'edge';
const InvitePage: React.FC = () => {
  return <PlayerInvite />;
};

export default InvitePage;
