import { Metadata } from 'next';
import React from 'react';

import DonateSuccessTemplate from '@/components/templates/DonateSuccessTemplate';

export const metadata: Metadata = {
  title: '寄付ありがとうございます',
  description: '寄付いただいたことに対する感謝メッセージのページです。',
};

/**
 * 寄付完了後のサンクスページ（/donate/success）。
 * 寄付者への感謝と次の導線を案内する。
 */
const DonateSuccessPage: React.FC = () => {
  return <DonateSuccessTemplate />;
};

export default DonateSuccessPage;
