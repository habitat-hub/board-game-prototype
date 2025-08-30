import React from 'react';
import { BiArea } from 'react-icons/bi';
import { Gi3dMeeple, GiCard10Clubs, GiPokerHand, GiStoneBlock } from 'react-icons/gi';

import { Part } from '@/api/types';

export type PartTypeIconProps = {
  type: Part['type'];
  className?: string;
};

export default function PartTypeIcon({ type, className }: PartTypeIconProps) {
  switch (type) {
    case 'token':
      return <Gi3dMeeple className={className} />;
    case 'card':
      return <GiCard10Clubs className={className} />;
    case 'hand':
      return <GiPokerHand className={className} />;
    case 'deck':
      return <GiStoneBlock className={className} />;
    case 'area':
      return <BiArea className={className} />;
    default:
      return null;
  }
}
