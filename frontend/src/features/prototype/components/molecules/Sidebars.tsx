'use client';

import { PiSidebarSimpleThin } from 'react-icons/pi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';
import { useRouter } from 'next/navigation';

import CreateButton from '@/components/atoms/CreateButton';
import {
  COLORS,
  PART_DEFAULT_CONFIG,
  PART_TYPE,
} from '@/features/prototype/const';
import NumberInput from '@/components/atoms/NumberInput';
import TextInput from '@/components/atoms/TextInput';

import { AllPart, Card, Hand, Player } from '../../type';

export default function Sidebars({
  prototypeName,
  leftIsMinimized,
  setLeftIsMinimized,
  groupId,
  players,
  selectedPart,
  onAddPart,
  updatePart,
  mainViewRef,
}: {
  prototypeName: string;
  leftIsMinimized: boolean;
  setLeftIsMinimized: (value: boolean) => void;
  groupId: number;
  players: Player[];
  selectedPart: AllPart | null;
  onAddPart: (part: AllPart) => void;
  updatePart: (part: Partial<AllPart>) => void;
  mainViewRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();

  /**
   * パーツを作成する
   * @param partId - パーツのID
   */
  const handleCreatePart = (partId: string) => {
    if (mainViewRef.current) {
      // メインビューの幅と高さを取得
      const mainViewWidth = mainViewRef.current.offsetWidth;
      const mainViewHeight = mainViewRef.current.offsetHeight;

      // 中央の座標を計算
      const centerX = mainViewWidth / 2;
      const centerY = mainViewHeight / 2;

      const partConfig = Object.values(PART_DEFAULT_CONFIG).find(
        (part) => part.id === partId
      );

      if (!partConfig) {
        return;
      }

      const newPart: Omit<AllPart, 'id' | 'prototypeVersionId' | 'order'> = {
        type: partId,
        parentId: null,
        name: partConfig.name,
        description: partConfig.description,
        color: partConfig.color,
        position: { x: centerX, y: centerY },
        width: partConfig.width,
        height: partConfig.height,
        configurableTypeAsChild: partConfig.configurableTypeAsChild,
        originalPartId: null,
      };
      if (partId === 'card') {
        (newPart as Card).isReversible = (
          partConfig as typeof PART_DEFAULT_CONFIG.CARD
        ).isReversible;
        (newPart as Card).isFlipped = false;
      }
      if (partId === 'hand') {
        (newPart as Hand).ownerId = players[0].id;
      }

      onAddPart(newPart as AllPart);
    }
  };

  return (
    <>
      {/* Left Sidebar */}
      {!leftIsMinimized ? (
        // TODO: 戻るボタン
        <div className="fixed left-0 flex h-full w-[240px] flex-col border-r border-gray-200 bg-white">
          <div className="p-4">
            <div className="flex justify-between">
              <h2 className="scroll-m-20 text-sm font-medium">
                {prototypeName}
              </h2>
              <PiSidebarSimpleThin
                onClick={() => setLeftIsMinimized(true)}
                className="h-5 w-5 cursor-pointer"
              />
            </div>
          </div>
          <div className="border-b border-gray-200" />
          <div className="flex flex-col gap-1 p-4">
            <span className="mb-2 text-xs font-medium">パーツ</span>
            {Object.values(PART_DEFAULT_CONFIG).map((part) => {
              const icon =
                part.id === 'card' ? (
                  <GiCard10Clubs className="h-4 w-4 text-gray-500" />
                ) : part.id === 'token' ? (
                  <Gi3dMeeple className="h-4 w-4 text-gray-500" />
                ) : part.id === 'hand' ? (
                  <GiPokerHand className="h-4 w-4 text-gray-500" />
                ) : part.id === 'deck' ? (
                  <GiStoneBlock className="h-4 w-4 text-gray-500" />
                ) : null;

              return (
                <CreateButton
                  key={part.id}
                  text={part.name}
                  isSelected={false}
                  icon={icon}
                  onClick={() => handleCreatePart(part.id)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="fixed left-2 top-14 flex h-[48px] w-[250px] items-center justify-between rounded-xl border bg-white p-4">
          <h2 className="scroll-m-20 text-sm font-medium">{prototypeName}</h2>
          <PiSidebarSimpleThin
            onClick={() => setLeftIsMinimized(false)}
            className="h-5 w-5 cursor-pointer"
          />
        </div>
      )}

      {/* Right Sidebar */}
      {selectedPart ? (
        <div
          className={`fixed h-full right-0 flex w-[240px] flex-col border-l border-gray-200 bg-white`}
        >
          <div className="flex items-center justify-end p-2">
            <button
              onClick={() => router.push(`/prototypes/group/${groupId}/invite`)}
              className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
            >
              アクセス権付与
            </button>
          </div>
          <div className="border-b border-gray-200"></div>
          <div className="flex flex-col gap-2 p-4">
            <span className="mb-2 text-[11px] font-medium">共通</span>
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-medium text-gray-500">位置</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  value={selectedPart.position.x}
                  onChange={(number) => {
                    updatePart({
                      position: { ...selectedPart.position, x: number },
                    });
                  }}
                  classNames="w-1/2"
                  icon={<p>X</p>}
                />
                <NumberInput
                  value={selectedPart.position.y}
                  onChange={(number) => {
                    updatePart({
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
                    updatePart({ width: number });
                  }}
                  classNames="w-1/2"
                  icon={<p>W</p>}
                />
                <NumberInput
                  value={selectedPart.height}
                  onChange={(number) => {
                    updatePart({ height: number });
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
                    updatePart({ name });
                  }}
                  classNames="w-full"
                  icon={<p>T</p>}
                />
              </div>
              <p className="text-[9px] font-medium text-gray-500">カラー</p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePart({ color })}
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
                    onChange={(e) => updatePart({ color: e.target.value })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm text-gray-600">
                    カスタムカラーを選択
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* TODO: セレクトボックス or チェックボックス */}
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
                    <TextInput
                      value={selectedPart.name}
                      onChange={(name) => {
                        updatePart({ name });
                      }}
                      classNames="w-full"
                      icon={<p>T</p>}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {/* TODO: セレクトボックス */}
          {selectedPart.type === PART_TYPE.HAND && (
            <>
              <div className="border-b border-gray-200"></div>
              <div className="flex flex-col gap-2 p-4">
                <span className="mb-2 text-[11px] font-medium">手札</span>
                <div className="flex flex-col gap-1">
                  <p className="text-[9px] font-medium text-gray-500">所有者</p>
                  <div className="flex w-full mb-2">
                    <TextInput
                      value={selectedPart.name}
                      onChange={(name) => {
                        updatePart({ name });
                      }}
                      classNames="w-full"
                      icon={<p>T</p>}
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
            onClick={() =>
              router.push(`/prototypes/group/${groupId.toString()}/invite`)
            }
            className="h-fit w-fit rounded-md bg-[#0c8ce9] px-4 py-2 text-[11px] text-white"
          >
            アクセス権付与
          </button>
        </div>
      )}
    </>
  );
}
