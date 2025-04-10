/**
 * @page パーツ編集ページに表示するパーツのプロパティを編集するサイドバー
 */

'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { FaRegCopy, FaRegTrashAlt } from 'react-icons/fa';

import { Part, PartProperty, Player } from '@/api/types';
import Dropdown from '@/components/atoms/Dropdown';
import NumberInput from '@/components/atoms/NumberInput';
import TextIconButton from '@/components/atoms/TextIconButton';
import TextInput from '@/components/atoms/TextInput';
import { COLORS } from '@/features/prototype/const';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { AddPartProps } from '@/features/prototype/type';
import { ValidationType } from '@/types/validation';
import { checkValue } from '@/utils/varidation';

export default function PartPropertySidebar({
  groupId,
  players,
  selectedPart,
  selectedPartProperties,
  onAddPart,
  onDeletePart,
  validationResults = [],
}: {
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // 選択中のパーツ
  selectedPart: Part | null;
  // 選択中のパーツのプロパティ
  selectedPartProperties: PartProperty[] | null;
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
  // パーツを削除時の処理
  onDeletePart: () => void;
  // バリデーション結果
  validationResults?: ValidationType[];
}) {
  const { dispatch } = usePartReducer();

  const router = useRouter();

  // パーツ名のバリデーション文言
  const [nameValidation, setNameValidation] = useState<string>();

  // 現在のプロパティ
  const currentProperty = useMemo(() => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !selectedPartProperties) return;

    return selectedPartProperties.find(
      (p) => p.side === (selectedPart.isFlipped ? 'back' : 'front')
    );
  }, [selectedPart, selectedPartProperties]);

  /**
   * パーツを複製する
   */
  const handleCopyPart = () => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !selectedPartProperties) return;

    // 新しいパーツ
    const newPart: Omit<
      Part,
      'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: selectedPart.type,
      parentId: selectedPart.parentId,
      // NOTE： 少し複製元からずらす
      position: {
        x: selectedPart.position.x + 10,
        y: selectedPart.position.y + 10,
      },
      width: selectedPart.width,
      height: selectedPart.height,
      configurableTypeAsChild: selectedPart.configurableTypeAsChild,
      // NOTE: これは複製用の属性ではないので、undefinedにする
      originalPartId: undefined,
    };

    // カードパーツの場合
    if (selectedPart.type === 'card') {
      newPart.isReversible = selectedPart.isReversible;
      newPart.isFlipped = selectedPart.isFlipped;
    }

    // 手札パーツの場合
    if (selectedPart.type === 'hand') {
      newPart.ownerId = selectedPart.ownerId;
    }

    // 新しいパーツのプロパティ
    const newPartProperties: Omit<
      PartProperty,
      'id' | 'partId' | 'createdAt' | 'updatedAt'
    >[] = selectedPartProperties.map(
      ({ side, name, description, color, image }) => {
        return {
          side,
          name,
          description,
          color,
          image,
        };
      }
    );
    onAddPart({ part: newPart, properties: newPartProperties });
  };

  /**
   * プロパティの値が変化している場合のみ更新処理を呼ぶ
   * @param property - 更新するプロパティ
   */
  const handleUpdateProperty = (property: Partial<PartProperty>) => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !currentProperty) return;

    // 新しいプロパティ
    const updatedProperty = { ...currentProperty, ...property };
    // 現在の値と新しい値が同じ場合
    if (JSON.stringify(currentProperty) === JSON.stringify(updatedProperty))
      return;

    // プロパティの最新化
    dispatch({
      type: 'UPDATE_PART',
      payload: {
        partId: selectedPart.id,
        updateProperties: [updatedProperty],
      },
    });
  };

  /**
   * パーツ名の登録を行う関数
   * @param name - パーツ名
   * @returns void
   */
  const handleChangedName = (name: string) => {
    const validationResult = checkValue('stringValidation', name);

    if (!validationResult.isValid) {
      setNameValidation(validationResult.errorMessage);
      return;
    }

    setNameValidation('');
    handleUpdateProperty({ name });
  };

  return (
    <>
      {selectedPart ? (
        <div
          className={`fixed h-full right-0 flex w-[240px] flex-col border-l border-gray-200 bg-white`}
        >
          <div className="flex items-center justify-end gap-2 p-2">
            <button
              onClick={() =>
                router.push(`/prototypes/groups/${groupId}/invite`)
              }
              className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
            >
              アクセス権付与
            </button>
          </div>
          <div className="border-b border-gray-200"></div>
          <div className="flex flex-col gap-2 p-4">
            <span className="mb-2 text-[11px] font-medium">共通</span>
            <div className="flex items-center px-2 pb-2">
              <div className="w-1/2">
                <TextIconButton
                  text="複製"
                  icon={<FaRegCopy className="h-3 w-3" />}
                  isSelected={false}
                  onClick={() => {
                    handleCopyPart();
                  }}
                />
              </div>
              <div className="w-1/2">
                <TextIconButton
                  text="削除"
                  icon={<FaRegTrashAlt className="h-3 w-3" />}
                  isSelected={false}
                  onClick={() => {
                    onDeletePart();
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-medium text-gray-500">位置</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  key={selectedPart.id}
                  value={selectedPart.position.x}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { position: { x: number } },
                      },
                    });
                  }}
                  icon={<p>X</p>}
                />
                <NumberInput
                  key={selectedPart.id}
                  value={selectedPart.position.y}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { position: { y: number } },
                      },
                    });
                  }}
                  icon={<p>Y</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">サイズ</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  key={selectedPart.id}
                  value={selectedPart.width}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { width: number },
                      },
                    });
                  }}
                  icon={<p>W</p>}
                />
                <NumberInput
                  key={selectedPart.id}
                  value={selectedPart.height}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { height: number },
                      },
                    });
                  }}
                  icon={<p>H</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">
                名前
                {validationResults.length > 0 ? (
                  <span style={{ color: 'red' }}>
                    {' '}
                    {validationResults[0].name.errorMessage}
                  </span>
                ) : nameValidation ? (
                  <span style={{ color: 'red' }}> {nameValidation}</span>
                ) : null}
              </p>
              <div
                className={`flex w-full mb-2 ${
                  nameValidation ? 'border border-red-500 rounded' : ''
                }`}
              >
                <TextInput
                  key={selectedPart.id}
                  value={currentProperty?.name ?? ''}
                  onChange={(name) => handleChangedName(name)}
                  icon={<p>T</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">説明</p>
              <div className="flex w-full mb-2">
                <TextInput
                  key={selectedPart.id}
                  value={currentProperty?.description ?? ''}
                  onChange={(description) =>
                    handleUpdateProperty({ description })
                  }
                  icon={<p>T</p>}
                  multiline
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">カラー</p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdateProperty({ color })}
                      className={`w-5 h-5 rounded-full border-2 ${
                        currentProperty?.color === color
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={currentProperty?.color || '#FFFFFF'}
                    onChange={(e) =>
                      handleUpdateProperty({ color: e.target.value })
                    }
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-600">
                    カスタムカラーを選択
                  </span>
                </div>
              </div>
            </div>
          </div>
          {selectedPart.type === 'card' && (
            <>
              <div className="border-b border-gray-200"></div>
              <div className="flex flex-col gap-2 p-4">
                <span className="mb-2 text-[11px] font-medium">カード</span>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-medium text-gray-500">
                    反転可能か？
                  </p>
                  <div className="flex w-full mb-2">
                    <Dropdown
                      value={selectedPart.isReversible ? 'はい' : 'いいえ'}
                      onChange={(value) => {
                        dispatch({
                          type: 'UPDATE_PART',
                          payload: {
                            partId: selectedPart.id,
                            updatePart: { isReversible: value === 'はい' },
                          },
                        });
                      }}
                      options={['はい', 'いいえ']}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedPart.type === 'hand' && (
            <>
              <div className="border-b border-gray-200"></div>
              <div className="flex flex-col gap-2 p-4">
                <span className="mb-2 text-[11px] font-medium">手札</span>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-medium text-gray-500">所有者</p>
                  <div className="flex w-full mb-2">
                    <Dropdown
                      value={
                        players.find(
                          (player) => player.id === selectedPart.ownerId
                        )?.playerName ?? '未設定'
                      }
                      onChange={(value) => {
                        const player = players.find(
                          (player) => player.playerName === value
                        );
                        if (player) {
                          dispatch({
                            type: 'UPDATE_PART',
                            payload: {
                              partId: selectedPart.id,
                              updatePart: { ownerId: player.id },
                            },
                          });
                        }
                      }}
                      options={[
                        '未設定',
                        ...players.map((player) => player.playerName),
                      ]}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedPart.type === 'deck' && (
            <>
              <div className="border-b border-gray-200"></div>
              <div className="flex flex-col gap-2 p-4">
                <span className="mb-2 text-[11px] font-medium">山札</span>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-medium text-gray-500">
                    カードを裏向きにするか？
                  </p>
                  <div className="flex w-full mb-2">
                    <Dropdown
                      value={
                        selectedPart.canReverseCardOnDeck ? 'はい' : 'いいえ'
                      }
                      onChange={(value) => {
                        dispatch({
                          type: 'UPDATE_PART',
                          payload: {
                            partId: selectedPart.id,
                            updatePart: {
                              canReverseCardOnDeck: value === 'はい',
                            },
                          },
                        });
                      }}
                      options={['はい', 'いいえ']}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="fixed right-2 top-16 flex items-center">
          <button
            onClick={() => router.push(`/prototypes/groups/${groupId}/invite`)}
            className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
          >
            アクセス権付与
          </button>
        </div>
      )}
    </>
  );
}
