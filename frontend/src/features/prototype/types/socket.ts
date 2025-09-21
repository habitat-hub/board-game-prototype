import { Part, PartProperty } from '@/__generated__/api/client';

/** パーツのマップ */
export type PartsMap = Map<number, Part>;
/** パーツのプロパティのマップ */
export type PropertiesMap = Map<number, PartProperty[]>;

/** パーツの Z 順を変更するためのアクション種別 */
export type ChangeOrderType = 'front' | 'back' | 'frontmost' | 'backmost';

/** CHANGE_ORDER のペイロード（ソケット送受信用） */
export type ChangeOrderPayload = { partId: number; type: ChangeOrderType };

/** パーツ追加のペイロード（ソケット送受信用） */
export type AddPartPayload = {
  part: Omit<Part, 'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'>;
  properties: Omit<PartProperty, 'partId' | 'createdAt' | 'updatedAt'>[];
};

/** パーツ更新のペイロード（ソケット送受信用） */
export type UpdatePartPayload = {
  partId: number;
  updatePart?: Partial<Part>;
  updateProperties?: Partial<PartProperty>[];
};

/** パーツ一括更新のペイロード（ソケット送受信用） */
export type UpdatePartsPayload = {
  updates: UpdatePartPayload[];
};

/** パーツ削除のペイロード（ソケット送受信用） */
export type DeletePartPayload = { partId: number };

/** パーツ一括削除のペイロード（ソケット送受信用） */
export type DeletePartsPayload = { partIds: number[] };

/** デッキのシャッフル（ソケット送受信用） */
export type ShuffleDeckPayload = { deckId: number };

/** パーツ追加のアクション（ソケット送受信用） */
export type AddPartAction = {
  type: 'ADD_PART';
  payload: AddPartPayload;
};

/** パーツ更新のアクション（ソケット送受信用） */
export type UpdatePartAction = {
  type: 'UPDATE_PART';
  payload: UpdatePartPayload;
};

/** パーツ一括更新のアクション（ソケット送受信用） */
export type UpdatePartsAction = {
  type: 'UPDATE_PARTS';
  payload: UpdatePartsPayload;
};

/** パーツ一括削除のアクション（ソケット送受信用） */
export type DeletePartsAction = {
  type: 'DELETE_PARTS';
  payload: DeletePartsPayload;
};

/** パーツの順番の変更のアクション（ソケット送受信用） */
export type ChangeOrderAction = {
  type: 'CHANGE_ORDER';
  payload: ChangeOrderPayload;
};

/** デッキのシャッフルのアクション（ソケット送受信用） */
export type ShuffleDeckAction = {
  type: 'SHUFFLE_DECK';
  payload: ShuffleDeckPayload;
};

/** パーツ選択共有の送信ペイロード */
export type SelectedPartsPayload = { selectedPartIds: number[] };

/** パーツ選択共有の受信ペイロード */
export type SelectedPartsResponse = {
  userId: string;
  username: string;
  selectedPartIds: number[];
};

/** PartAction: usePartReducer で使われるアクションの型（ソケット送受信用） */
export type PartAction =
  | AddPartAction
  | UpdatePartAction
  | UpdatePartsAction
  | DeletePartsAction
  | ChangeOrderAction
  | ShuffleDeckAction;

/** dispatch 関数の型定義 */
export type PartDispatch = (action: PartAction) => void;
