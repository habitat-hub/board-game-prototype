import { Metadata } from 'next';
import React from 'react';

import BussinessInformation from '@/features/information/conponents/template/BussinessInformation';

export const metadata: Metadata = {
  title: 'サービス情報 / 運営概要',
  description: 'KIBAKO のサービス概要・運営に関する情報を掲載するページです。',
  robots: { index: true, follow: true },
};

const BussinessInformationPage: React.FC = () => {
  return <BussinessInformation />;
};

export default BussinessInformationPage;
