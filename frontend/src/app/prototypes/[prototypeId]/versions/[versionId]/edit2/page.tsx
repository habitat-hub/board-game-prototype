import type { Metadata } from 'next';

import PrototypeEdit2 from '@/features/prototype/components/organisms/PrototypeEdit2';

export const metadata: Metadata = {
  title: 'プロトタイプ編集',
};

export const runtime = 'edge';
export default function Page() {
  return <PrototypeEdit2 />;
}
