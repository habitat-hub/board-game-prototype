import { Metadata } from 'next';
import React from 'react';

import DonationTemplate from '@/features/donation/components/templates/DonationTemplate';

// ページのメタデータ（SEO用）
export const metadata: Metadata = {
  title: '寄付のお願い',
  description:
    'KIBAKO のさらなる開発を支援する寄付ページです。いただいた寄付は機能開発や運営費に充てられます。',
};

const DonatePage: React.FC = () => {
  return <DonationTemplate />;
};

export default DonatePage;
