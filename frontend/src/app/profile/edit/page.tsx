import { Metadata } from 'next';
import React from 'react';

import ProfileEdit from '@/features/profile/components/ProfileEdit';

export const metadata: Metadata = {
  title: 'プロフィール編集',
};

export const runtime = 'edge';
const ProfileEditPage: React.FC = () => {
  return <ProfileEdit />;
};

export default ProfileEditPage;
