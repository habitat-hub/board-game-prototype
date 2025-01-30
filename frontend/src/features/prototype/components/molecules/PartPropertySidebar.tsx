'use client';

import { useRouter } from 'next/navigation';
import { FaRegCopy, FaRegTrashAlt } from 'react-icons/fa';

import Dropdown from '@/components/atoms/Dropdown';
import NumberInput from '@/components/atoms/NumberInput';
import TextIconButton from '@/components/atoms/TextIconButton';
import TextInput from '@/components/atoms/TextInput';
import { COLORS, PART_TYPE, TITLE_COLORS } from '@/features/prototype/const';
import { Part, Player } from '@/types/models';

export default function PartPropertySidebar({
  groupId,
  players,
  selectedPart,
  onAddPart,
  onDeletePart,
  updatePart,
}: {
  groupId: string;
  players: Player[];
  selectedPart: Part | null;
  onAddPart: (part: Part) => void;
  onDeletePart: () => void;
  updatePart: (
    partId: number,
    updatePart: Partial<Part>,
    isFlipped?: boolean
  ) => void;
}) {
  const router = useRouter();

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
      name: selectedPart.name,
      description: selectedPart.description,
      color: selectedPart.color,
      titleColor: selectedPart.titleColor,
      playerNameColor: selectedPart.playerNameColor,
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

    onAddPart(newPart as Part);
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
                  value={selectedPart.name}
                  onChange={(name) => {
                    updatePart(selectedPart.id, { name });
                  }}
                  classNames="w-full"
                  icon={<p>T</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">説明</p>
              <div className="flex w-full mb-2">
                <TextInput
                  value={selectedPart.description}
                  onChange={(description) => {
                    updatePart(selectedPart.id, { description });
                  }}
                  classNames="w-full"
                  icon={<p>T</p>}
                  multiline={true}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">
                タイトルカラー
              </p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {TITLE_COLORS.map((titleColor) => (
                    <button
                      key={titleColor}
                      onClick={() =>
                        updatePart(selectedPart.id, { titleColor })
                      }
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedPart.titleColor === titleColor
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: titleColor }}
                      title={titleColor}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPart.titleColor || '#000000'}
                    onChange={(e) =>
                      updatePart(selectedPart.id, {
                        titleColor: e.target.value,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-600">
                    カスタムカラーを選択
                  </span>
                </div>
              </div>
              <p className="text-[9px] font-medium text-gray-500">背景色</p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePart(selectedPart.id, { color })}
                      className={`w-5 h-5 rounded-full border-2 ${
                        selectedPart.color === color
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
                    value={selectedPart.color || '#FFFFFF'}
                    onChange={(e) =>
                      updatePart(selectedPart.id, { color: e.target.value })
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
