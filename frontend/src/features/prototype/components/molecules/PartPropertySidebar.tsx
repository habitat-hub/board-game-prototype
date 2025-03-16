'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { FaRegCopy, FaRegTrashAlt } from 'react-icons/fa';

import Dropdown from '@/components/atoms/Dropdown';
import NumberInput from '@/components/atoms/NumberInput';
import TextIconButton from '@/components/atoms/TextIconButton';
import TextInput from '@/components/atoms/TextInput';
import { COLORS, PART_TYPE } from '@/features/prototype/const';
import { Part, PartProperty, Player } from '@/types/models';

export default function PartPropertySidebar({
  groupId,
  players,
  selectedPart,
  selectedPartProperties,
  onAddPart,
  onDeletePart,
  updatePart,
}: {
  groupId: string;
  players: Player[];
  selectedPart: Part | null;
  selectedPartProperties: PartProperty[] | null;
  onAddPart: (part: Part, properties: PartProperty[]) => void;
  onDeletePart: () => void;
  updatePart: (
    partId: number,
    updatePart?: Partial<Part>,
    updateProperties?: Partial<PartProperty>[],
    isFlipped?: boolean
  ) => void;
}) {
  const router = useRouter();

  // currentPropertyを取得
  const currentProperty = useMemo(() => {
    if (!selectedPart || !selectedPartProperties) return null;
    return selectedPartProperties.find(
      (p) => p.side === (selectedPart.isFlipped ? 'back' : 'front')
    );
  }, [selectedPart, selectedPartProperties]);

  /**
   * パーツを複製する
   */
  const handleCopyPart = () => {
    if (!selectedPart) return;

    const newPart: Omit<
      Part,
      'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: selectedPart.type,
      parentId: selectedPart.parentId,
      position: {
        x: (selectedPart.position.x as number) + 10,
        y: (selectedPart.position.y as number) + 10,
      },
      width: selectedPart.width,
      height: selectedPart.height,
      configurableTypeAsChild: selectedPart.configurableTypeAsChild,
      originalPartId: undefined,
    };
    if (selectedPart.type === PART_TYPE.CARD) {
      newPart.isReversible = selectedPart.isReversible;
      newPart.isFlipped = selectedPart.isFlipped;
    }
    if (selectedPart.type === PART_TYPE.HAND) {
      newPart.ownerId = selectedPart.ownerId;
    }

    if (!selectedPartProperties) return;

    const newPartProperties: Omit<
      PartProperty,
      'id' | 'partId' | 'createdAt' | 'updatedAt'
    >[] = selectedPartProperties.map((property) => {
      return {
        side: property.side,
        name: property.name,
        description: property.description,
        color: property.color,
        image: property.image,
      };
    });
    onAddPart(newPart as Part, newPartProperties as PartProperty[]);
  };

  // propertyの値が変化している場合のみ更新処理を呼ぶ
  const handleUpdateProperty = (property: Partial<PartProperty>) => {
    if (currentProperty && selectedPart) {
      const updatedProperty = { ...currentProperty, ...property };
      // 現在の値と新しい値を比較
      if (JSON.stringify(currentProperty) !== JSON.stringify(updatedProperty)) {
        updatePart(selectedPart.id, undefined, [updatedProperty]);
      }
    }
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
                  value={selectedPart.position.x as number}
                  onChange={(number) => {
                    updatePart(selectedPart.id, {
                      position: { ...selectedPart.position, x: number },
                    });
                  }}
                  classNames="w-1/2"
                  icon={<p>X</p>}
                />
                <NumberInput
                  value={selectedPart.position.y as number}
                  onChange={(number) => {
                    updatePart(selectedPart.id, {
                      position: { ...selectedPart.position, y: number },
                    });
                  }}
                  classNames="w-1/2"
                  icon={<p>Y</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">サイズ</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  value={selectedPart.width}
                  onChange={(number) => {
                    updatePart(selectedPart.id, { width: number });
                  }}
                  classNames="w-1/2"
                  icon={<p>W</p>}
                />
                <NumberInput
                  value={selectedPart.height}
                  onChange={(number) => {
                    updatePart(selectedPart.id, { height: number });
                  }}
                  classNames="w-1/2"
                  icon={<p>H</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">名前</p>
              <div className="flex w-full mb-2">
                <TextInput
                  value={currentProperty?.name ?? ''}
                  onChange={(name) => handleUpdateProperty({ name })}
                  classNames="w-full"
                  icon={<p>T</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">説明</p>
              <div className="flex w-full mb-2">
                <TextInput
                  value={currentProperty?.description ?? ''}
                  onChange={(description) =>
                    handleUpdateProperty({ description })
                  }
                  classNames="w-full"
                  icon={<p>T</p>}
                  multiline={true}
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
          {selectedPart.type === PART_TYPE.CARD && (
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
                        updatePart(
                          selectedPart.id,
                          {
                            isReversible: value === 'はい',
                          },
                          undefined,
                          true
                        );
                      }}
                      options={['はい', 'いいえ']}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedPart.type === PART_TYPE.HAND && (
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
                          updatePart(selectedPart.id, { ownerId: player.id });
                        }
                      }}
                      options={[
                        '未設定',
                        ...players.map((player) => player.playerName),
                      ]}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {selectedPart.type === PART_TYPE.DECK && (
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
                        updatePart(
                          selectedPart.id,
                          {
                            canReverseCardOnDeck: value === 'はい',
                          },
                          undefined,
                          true
                        );
                      }}
                      options={['はい', 'いいえ']}
                      className="w-full"
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
