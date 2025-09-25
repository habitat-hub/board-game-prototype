import { Metadata } from 'next';
import React from 'react';

import TermsOfService from '@/features/terms-of-service/components/templates/TermsOfService';

export const metadata: Metadata = {
  title: '利用規約',
  description:
    'KIBAKO の利用規約を掲載しています。サービスをご利用いただく前に必ずご確認ください。',
};

const TermsOfServicePage: React.FC = () => {
  return <TermsOfService />;
};

export default TermsOfServicePage;
