import React from 'react';
import { BiArea } from 'react-icons/bi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';

import { Part } from '@/api/types';

/** パーツ種別に応じたアイコンを表示するためのプロパティ */
export type PartTypeIconProps = {
  /** パーツの種類 */
  type: Part['type'];
  /** アイコンに適用するクラス名 */
  className?: string;
  /** アクセシビリティ: 装飾アイコンとして非表示にする場合に指定（既定: true） */
  ariaHidden?: boolean;
};

/**
 * パーツ種別に応じて対応するアイコンを返すコンポーネント
 * - 装飾目的の場合は ariaHidden を true にする
 */
export default function PartTypeIcon({
  type,
  className,
  ariaHidden = true,
}: PartTypeIconProps): React.ReactElement | null {
  switch (type) {
    case 'token':
      return <Gi3dMeeple className={className} aria-hidden={ariaHidden} />;
    case 'card':
      return <GiCard10Clubs className={className} aria-hidden={ariaHidden} />;
    case 'hand':
      return <GiPokerHand className={className} aria-hidden={ariaHidden} />;
    case 'deck':
      return <GiStoneBlock className={className} aria-hidden={ariaHidden} />;
    case 'area':
      return <BiArea className={className} aria-hidden={ariaHidden} />;
    default:
      return null;
  }
}
