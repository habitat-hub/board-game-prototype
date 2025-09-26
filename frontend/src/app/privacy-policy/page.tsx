import { Metadata } from 'next';
import React from 'react';

import PrivacyPolicy from '@/features/privacy-policy/components/templates/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description:
    'KIBAKO のプライバシーポリシーを掲載しています。個人情報のお取り扱いについてご確認いただけます。',
  robots: { index: true, follow: true },
};

const PrivacyPolicyPage: React.FC = () => {
  return <PrivacyPolicy />;
};

export default PrivacyPolicyPage;
