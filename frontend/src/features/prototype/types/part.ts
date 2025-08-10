import { Image, Part, PartProperty } from '@/api/types';

/**
 * パーツのデフォルト設定
 */
export interface PartDefaultConfig {
  /** パーツの種類 */
  type: Part['type'];
  /** パーツの名前 */
  name: PartProperty['name'];
  /** パーツの幅 */
  width: Part['width'];
  /** パーツの高さ */
  height: Part['height'];
  /** パーツの説明 */
  description: PartProperty['description'];
  /** パーツのテキスト色 */
  textColor: PartProperty['textColor'];
  /** パーツの背景色 */
  color: PartProperty['color'];
  /** 表面の説明 */
  frontDescription?: PartProperty['description'];
  /** 裏面の説明 */
  backDescription?: PartProperty['description'];
}

/**
 * パーツの共通プロパティ型
 */
export interface CommonPartProperties
  extends Pick<PartProperty, 'name' | 'description' | 'color' | 'textColor'> {}

/**
 * パーツを追加時のprops
 */
export interface AddPartProps {
  /** パーツ */
  part: Omit<Part, 'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'>;
  /** プロパティ */
  properties: Omit<PartProperty, 'id' | 'createdAt' | 'updatedAt' | 'partId'>[];
}

/**
 * PartPropertyにImageを追加した型
 */
export interface PartPropertyWithImage extends PartProperty {
  /** 画像 */
  image?: Image;
}

/**
 * プロパティ更新用の型定義（imageIdにnullを許容）
 */
export type PartPropertyUpdate = Omit<Partial<PartProperty>, 'imageId'> & {
  imageId?: string | null;
};

/**
 * 画像削除時のprops
 */
export interface DeleteImageProps {
  /** 画像ID */
  imageId: string;
  /** パーツID */
  partId: number;
  /** 表面か裏面か */
  side: 'front' | 'back';
  /** プロトタイプID */
  prototypeId: string;
  /** 更新をemitするかどうか */
  emitUpdate: 'true' | 'false';
}
