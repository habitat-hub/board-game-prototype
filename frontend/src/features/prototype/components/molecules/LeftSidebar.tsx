/**
 * @page サイドバーコンポーネント（プレビューモードとパーツ作成モードを兼ねている）
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BsBoxSeam } from 'react-icons/bs';
import { IoArrowBack, IoMenu, IoAdd } from 'react-icons/io5';
import { MdMeetingRoom, MdDelete } from 'react-icons/md';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, PrototypeGroup } from '@/api/types';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import formatDate from '@/utils/dateFormat';

export default function LeftSidebar({
  prototypeName,
  gameBoardMode,
  groupId,
}: {
  prototypeName: string;
  gameBoardMode: GameBoardMode;
  groupId: string;
}) {
  const router = useRouter();
  const { getPrototypeGroup, createPrototypeVersion } = usePrototypeGroup();
  const { deletePrototype } = usePrototypes();

  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  const [prototypeInfo, setPrototypeInfo] = useState<{
    group: PrototypeGroup | null;
    master: Prototype | null;
    versions: Prototype[];
    instances: Prototype[];
    instancesByVersion: Record<string, Prototype[]>;
  } | null>(null);
  const [isRoomCreating, setIsRoomCreating] = useState(false);

  /**
   * プロトタイプを取得する
   */
  const getPrototypes = useCallback(async () => {
    try {
      const { prototypeGroup, prototypes } = await getPrototypeGroup(groupId);

      // マスター版プロトタイプ
      const master = prototypes.find(({ type }) => type === 'MASTER');
      // バージョン版プロトタイプ
      const versions = prototypes.filter(({ type }) => type === 'VERSION');
      // インスタンス版プロトタイプ
      const instances = prototypes.filter(({ type }) => type === 'INSTANCE');

      // バージョンごとにインスタンスをグループ化
      const instancesByVersion: Record<string, Prototype[]> = {};
      versions.forEach((version) => {
        instancesByVersion[version.id] = instances.filter((_instance) => {
          // インスタンスがどのバージョンから作られたかを判定
          return _instance.sourceVersionPrototypeId === version.id;
        });
      });

      setPrototypeInfo({
        group: prototypeGroup || null,
        master: master || null,
        versions,
        instances,
        instancesByVersion,
      });
    } catch (error) {
      console.error('Error fetching prototypes:', error);
    }
  }, [getPrototypeGroup, groupId]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypes();
  }, [getPrototypes]);

  // ルーム作成（バージョン＋インスタンス）
  const handleCreateRoom = async () => {
    if (isRoomCreating) return;
    setIsRoomCreating(true);
    try {
      // バージョン作成
      await createPrototypeVersion(groupId, {
        name: 'ルーム',
        versionNumber: (prototypeInfo?.versions?.length || 0) + 1,
      });
      // 今はバージョンのプレイ画面に遷移 → グループID・プロトタイプIDで遷移
      await getPrototypes();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsRoomCreating(false);
    }
  };

  // ルーム削除
  const handleDeleteRoom = async (instanceId: string) => {
    if (!window.confirm('本当にこのルームを削除しますか？')) return;
    await deletePrototype(instanceId);
    await getPrototypes();
  };

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // タイプバッジの表示
  const renderTypeBadge = () => {
    switch (gameBoardMode) {
      case GameBoardMode.CREATE:
        return (
          <span
            className="ml-2 px-2 py-0.5 rounded text
            -xs font-bold bg-amber-100 text-amber-700 border border-amber-200"
          >
            作成中
          </span>
        );
      case GameBoardMode.PREVIEW:
        return (
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            プレビュー
          </span>
        );
      case GameBoardMode.PLAY:
        return (
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
            プレイ中
          </span>
        );
      default:
        return null;
    }
  };

  // 新デザイン: 「作る」「遊ぶ」
  const renderSidebarContent = () => {
    if (!prototypeInfo) return null;
    return (
      <div className="p-3 overflow-y-auto scrollbar-hide space-y-8">
        {/* 作る */}
        <section>
          <h3 className="text-xs font-bold text-amber-700 mb-2 tracking-widest">
            作る
          </h3>
          <div className="flex flex-col gap-2">
            {/* 編集ボタンの色をamber系に */}
            <button
              onClick={() =>
                router.push(
                  `/groups/${groupId}/prototypes/${prototypeInfo.master?.id}`
                )
              }
              className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-2 border-amber-200 rounded-xl p-3 transition-all shadow-sm"
            >
              <BsBoxSeam className="h-6 w-6 text-amber-600" />
              <span className="font-medium text-amber-800 text-sm">
                プロトタイプを編集
              </span>
            </button>
          </div>
        </section>

        {/* 遊ぶ */}
        <section>
          <h3 className="text-xs font-bold text-amber-700 mb-2 tracking-widest">
            遊ぶ
          </h3>
          {/* 既存ルーム一覧 */}
          <div className="mt-0">
            <div className="flex flex-col gap-3 py-1 px-0.5">
              {prototypeInfo.instances.map((instance) => (
                <div key={instance.id} className="relative flex-shrink-0">
                  <Link
                    href={`/groups/${groupId}/prototypes/${instance.id}`}
                    className="group"
                    title={`${instance.name} (Room ${instance.versionNumber})`}
                  >
                    {/* ルームカードの色をamber系に */}
                    <div className="flex items-center bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 hover:border-amber-400 rounded-xl px-6 py-5 shadow-lg min-w-[140px] text-left transition-all gap-4">
                      {/* ドアアイコンを左寄せ */}
                      <MdMeetingRoom className="h-9 w-9 text-amber-600 flex-shrink-0 mr-2" />
                      <div className="flex flex-col min-w-0 flex-1">
                        {/* ルーム名 */}
                        <span className="text-base font-semibold text-amber-800 truncate block max-w-[180px]">
                          {instance.name}
                        </span>
                        {/* バージョン番号と作成日 */}
                        <span className="text-sm text-amber-700 mt-1 flex items-center gap-2">
                          <span className="font-bold">
                            Ver{instance.versionNumber}
                          </span>
                          {/* 作成日を表示（createdAtがなければ省略） */}
                          {instance.createdAt && (
                            <span className="text-gray-400">
                              {formatDate(instance.createdAt, true)}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {/* 削除ボタン（ゴミ箱アイコン・上下中央揃え） */}
                  <button
                    onClick={() => handleDeleteRoom(instance.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full group/delete hover:bg-red-100 focus:outline-none flex items-center justify-center"
                    title="ルームを削除"
                  >
                    <MdDelete className="h-6 w-6 text-gray-400 transition-colors" />
                  </button>
                </div>
              ))}
              {prototypeInfo.instances.length === 0 && (
                <span className="text-xs text-gray-400 flex items-center px-2">
                  まだルームがありません
                </span>
              )}
              {/* 新しいルームを作るボタンをカード型で表示 */}
              {/* 新規ルーム作成ボタンもamber系に */}
              <button
                onClick={handleCreateRoom}
                disabled={isRoomCreating}
                className="flex items-center justify-center border-2 border-dashed border-amber-400 hover:border-amber-600 rounded-xl px-4 py-3 min-w-[90px] text-center shadow-none transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0 bg-white gap-3"
                style={{ height: '72px' }}
                title="新しいルームを作る"
              >
                {/* ルームアイコンを大きめに */}
                <MdMeetingRoom className="h-7 w-7 text-amber-400 transition-colors" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-amber-700 block">
                    新規ルーム
                  </span>
                  <span className="text-xs text-amber-400">作成</span>
                </div>
                <IoAdd className="h-5 w-5 text-amber-400 ml-2 transition-colors" />
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[18rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <div className="flex h-[48px] items-center justify-between p-2">
        <button
          onClick={() => router.push(`/groups/`)}
          className="p-1 hover:bg-wood-lightest/20 rounded-full transition-colors flex-shrink-0"
          title="戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <div className="flex items-center gap-1 flex-grow ml-1 min-w-0">
          <h2
            className="text-xs font-medium truncate text-wood-darkest"
            title={prototypeName}
          >
            {prototypeName}
          </h2>
          {renderTypeBadge()}
        </div>
        <button
          onClick={toggleSidebar}
          aria-label={
            isLeftSidebarMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'
          }
          className="p-1 rounded-full transition-transform hover:scale-110"
        >
          <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
      </div>
      {!isLeftSidebarMinimized && renderSidebarContent()}
    </div>
  );
}
