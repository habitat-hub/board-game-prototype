/**
 * @page サイドバーコンポーネント（プレビューモードとパーツ作成モードを兼ねている）
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { BsBoxSeam } from 'react-icons/bs';
import { HiPuzzlePiece } from 'react-icons/hi2';
import { IoArrowBack, IoMenu, IoAdd } from 'react-icons/io5';
import { MdMeetingRoom } from 'react-icons/md';

import { usePrototypeGroup } from '@/api/hooks/usePrototypeGroup';
import { Prototype, PrototypeGroup } from '@/api/types';
import formatDate from '@/utils/dateFormat';

export default function LeftSidebar({
  prototypeName,
  prototypeVersionNumber,
  prototypeType,
  isVersionPrototype,
  groupId,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号（プレビューモード時のみ使用）
  prototypeVersionNumber?: number;
  // プロトタイプタイプ（'preview'または'edit'）
  prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
  // マスタープレビューかどうか（プレビューモード時のみ使用）
  isVersionPrototype: boolean;
  // グループID
  groupId: string;
}) {
  const router = useRouter();
  const { getPrototypeGroup, createPrototypeVersion, createPrototypeInstance } =
    usePrototypeGroup();

  // 左サイドバーが最小化されているか
  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);

  // プロトタイプ情報の状態管理
  const [prototypeInfo, setPrototypeInfo] = useState<{
    group: PrototypeGroup | null;
    master: Prototype | null;
    versions: Prototype[];
    instances: Prototype[];
    instancesByVersion: Record<string, Prototype[]>;
  } | null>(null);

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
          // 実際のデータ構造に応じて調整が必要かもしれません
          return true; // 暫定的にすべてのインスタンスを各バージョンに含める
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

  /**
   * バージョンを作成する
   */
  const handleCreateVersion = async () => {
    try {
      await createPrototypeVersion(groupId, {
        name: 'バージョン',
        versionNumber: 1,
      });
      await getPrototypes(); // 一覧を更新
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  /**
   * ルーム（インスタンス）を作成する
   */
  const handleCreateRoom = async (versionId: string) => {
    try {
      await createPrototypeInstance(groupId, versionId, {
        name: 'ルーム',
        versionNumber: 1,
      });
      await getPrototypes(); // 一覧を更新
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  // 左サイドバーのヘッダーコンポーネント
  const LeftSidebarHeader = ({
    prototypeName,
    groupId,
    isMinimized,
    onToggle,
  }: {
    prototypeName: string;
    prototypeVersionNumber?: number;
    prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
    isVersionPrototype: boolean;
    groupId: string;
    isMinimized: boolean;
    onToggle: () => void;
  }) => {
    return (
      <div className="flex h-[48px] items-center justify-between px-1 py-2">
        <button
          onClick={() => router.push(`/groups/${groupId}`)}
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
        </div>
        <button
          onClick={onToggle}
          aria-label={isMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'}
          className="p-1 rounded-full transition-transform hover:scale-110"
        >
          <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
      </div>
    );
  };

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // プロトタイプ一覧のコンテンツをレンダリング
  const renderPrototypeListContent = () => {
    if (!prototypeInfo) return null;

    return (
      <>
        <div className="border-b border-wood-light/30" />
        <div className="flex flex-col gap-2 p-2 overflow-y-auto scrollbar-hide">
          {/* マスタープロトタイプ */}
          {prototypeInfo.master && (
            <div className="mb-2">
              {prototypeType === 'MASTER' ? (
                // 現在コンポーネント編集中
                <div className="block bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-2 border-2 border-amber-300 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-200 rounded-lg">
                      <BsBoxSeam className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800 text-sm flex items-center gap-1">
                        コンポーネント編集
                        <span className="px-2 py-0.5 text-xs bg-amber-200 text-amber-700 rounded-full border border-amber-300">
                          編集中
                        </span>
                      </h4>
                      <p className="text-xs text-amber-700/80 mt-1">
                        パーツとプロパティの編集
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/groups/${groupId}/prototypes/${prototypeInfo.master.id}/edit`}
                  className="block bg-white/80 rounded-lg p-2 border border-wood-light/30 hover:bg-white/90 hover:border-wood-light/50 transition-all group"
                  title={prototypeInfo.master.name}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-wood-lightest/40 rounded-lg group-hover:bg-wood-lightest/60 transition-colors">
                      <BsBoxSeam className="h-5 w-5 text-wood-dark group-hover:text-header transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-wood-darkest text-sm">
                        コンポーネント編集
                      </h4>
                      <p className="text-xs text-wood-dark/70 mt-1">
                        パーツとプロパティの編集
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* バージョン一覧 */}
          <div className="mb-2">
            {/* バージョン作成ボタン */}
            <button
              onClick={handleCreateVersion}
              className="w-full mb-2 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 border border-amber-200 hover:border-amber-300 rounded-lg p-2 transition-all group"
              title="コンポーネントを配置してゲームバージョンを作成"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <HiPuzzlePiece className="h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-amber-700 text-xs">
                    新しいゲーム配置を作成
                  </h4>
                  <p className="text-xs text-amber-600/80 mt-1">
                    初期配置にしてプレイ準備
                  </p>
                </div>
                <IoAdd className="h-4 w-4 text-amber-600 group-hover:text-amber-700 transition-colors" />
              </div>
            </button>
            {prototypeInfo.versions.length > 0 ? (
              <div className="space-y-2">
                {prototypeInfo.versions.map((version) => (
                  <div key={version.id} className="space-y-1">
                    {/* バージョン情報 */}
                    <div className="bg-white/80 rounded-lg p-2 border border-wood-light/30">
                      <Link
                        href={`/prototypes/${version.id}/versions/${version.id}/play`}
                        className="flex items-center gap-2 hover:bg-wood-lightest/20 rounded-md p-1 -m-1 transition-all"
                        title="プレビュー"
                      >
                        <div className="p-1 text-wood hover:text-header rounded-md transition-all">
                          <HiPuzzlePiece className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-wood-darkest text-sm">
                            {formatDate(version.createdAt, true)}版
                          </h4>
                        </div>
                      </Link>
                    </div>

                    {/* このバージョンのルーム一覧 */}
                    <div className="ml-2">
                      {/* ルーム一覧 */}
                      {prototypeInfo.instancesByVersion[version.id]?.length >
                      0 ? (
                        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                          {prototypeInfo.instancesByVersion[version.id].map(
                            (instance) => (
                              <Link
                                key={instance.id}
                                href={`/prototypes/${instance.id}/instances/${instance.id}/play`}
                                className="flex-shrink-0 group"
                                title={instance.name}
                              >
                                <div className="bg-white/60 rounded-lg p-1.5 border border-wood-light/20 hover:bg-white/80 hover:border-wood-light/40 transition-all w-12 h-12 flex flex-col items-center justify-center">
                                  <MdMeetingRoom className="h-5 w-5 text-wood-dark group-hover:text-header transition-colors" />
                                  <span className="text-xs font-medium text-wood-darkest mt-0.5">
                                    v{instance.versionNumber}
                                  </span>
                                </div>
                              </Link>
                            )
                          )}
                          {/* 新しいルーム作成ボタン */}
                          <button
                            onClick={() => handleCreateRoom(version.id)}
                            className="flex-shrink-0 group"
                            title="新しいルーム作成"
                          >
                            <div className="bg-white/40 rounded-lg p-1.5 border border-dashed border-wood-light/30 hover:bg-white/60 hover:border-wood-light/50 transition-all w-12 h-12 flex flex-col items-center justify-center">
                              <IoAdd className="h-5 w-5 text-wood-dark group-hover:text-header transition-colors" />
                              <span className="text-xs font-medium text-wood-dark/70 mt-0.5">
                                追加
                              </span>
                            </div>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleCreateRoom(version.id)}
                            className="group"
                            title="最初のルーム作成"
                          >
                            <div className="bg-white/40 rounded-lg p-1.5 border border-dashed border-wood-light/30 hover:bg-white/60 hover:border-wood-light/50 transition-all w-12 h-12 flex flex-col items-center justify-center">
                              <IoAdd className="h-5 w-5 text-wood-dark group-hover:text-header transition-colors" />
                              <span className="text-xs font-medium text-wood-dark/70 mt-0.5">
                                作成
                              </span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[18rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <LeftSidebarHeader
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        prototypeType={prototypeType}
        isVersionPrototype={isVersionPrototype}
        groupId={groupId}
        isMinimized={isLeftSidebarMinimized}
        onToggle={toggleSidebar}
      />

      {!isLeftSidebarMinimized && <>{renderPrototypeListContent()}</>}
    </div>
  );
}
