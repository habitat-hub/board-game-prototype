import { Metadata } from 'next';

import Maintenance from '@/components/templates/Maintenance';

const MAINTENANCE_TITLE = 'メンテナンス中';
const MAINTENANCE_DESCRIPTION =
  'KIBAKOは現在メンテナンス中です。しばらくお待ちください。';

export const metadata: Metadata = {
  title: MAINTENANCE_TITLE,
  description: MAINTENANCE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: MAINTENANCE_TITLE,
    description: MAINTENANCE_DESCRIPTION,
    type: 'website',
  },
  twitter: {
    title: MAINTENANCE_TITLE,
    description: MAINTENANCE_DESCRIPTION,
  },
};

export default function MaintenancePage() {
  return <Maintenance />;
}
