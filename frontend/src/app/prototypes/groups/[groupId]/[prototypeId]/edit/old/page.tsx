import type { Metadata } from 'next';

import PrototypeEditOld from '@/features/prototype/components/organisms/PrototypeEditOld';

export const metadata: Metadata = {
  title: 'プロトタイプ編集',
};

export const runtime = 'edge';
export default function Page() {
  return <PrototypeEditOld />;
}
