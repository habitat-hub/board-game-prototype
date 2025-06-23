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
        <div className="p-3 overflow-y-auto scrollbar-hide">
          {/* ワークフロー表示 */}
          <div className="space-y-3">
            {/* STEP 1: コンポーネント設計 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-sm font-semibold text-wood-darkest">
                  コンポーネント設計
                </h3>
              </div>

              {prototypeInfo.master && (
                <div className="ml-8 mb-4">
                  {prototypeType === 'MASTER' ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border-2 border-blue-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BsBoxSeam className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-blue-800 text-sm">
                              パーツ・プロパティ編集
                            </h4>
                            <span className="px-2 py-1 text-xs bg-blue-200 text-blue-700 rounded-full font-medium">
                              編集中
                            </span>
                          </div>
                          <p className="text-xs text-blue-700/70 mt-1">
                            ゲームの基本要素を定義
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={`/groups/${groupId}/prototypes/${prototypeInfo.master.id}/edit`}
                      className="block bg-white/90 hover:bg-blue-50/50 rounded-xl p-3 border border-blue-200/50 hover:border-blue-300 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                          <BsBoxSeam className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-800 text-sm">
                            パーツ・プロパティ編集
                          </h4>
                          <p className="text-xs text-blue-700/70 mt-1">
                            ゲームの基本要素を定義
                          </p>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {/* 矢印 */}
              <div className="ml-3 flex justify-center">
                <div className="w-0.5 h-4 bg-gradient-to-b from-blue-300 to-green-300"></div>
              </div>
            </div>

            {/* STEP 2: ゲーム配置作成 */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <h3 className="text-sm font-semibold text-wood-darkest">
                  ゲーム配置作成
                </h3>
              </div>

              <div className="ml-8 mb-4 space-y-3">
                {/* 新規作成ボタン */}
                <button
                  onClick={handleCreateVersion}
                  className="w-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-dashed border-green-300 hover:border-green-400 rounded-xl p-3 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <IoAdd className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-green-700 text-sm">
                        新しい配置を作成
                      </h4>
                      <p className="text-xs text-green-600/80 mt-1">
                        コンポーネントを配置してゲーム準備
                      </p>
                    </div>
                  </div>
                </button>

                {/* 既存のバージョン一覧 */}
                {prototypeInfo.versions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-wood-dark/70 uppercase tracking-wide">
                      作成済み配置
                    </h5>
                    {prototypeInfo.versions.map((version) => (
                      <div
                        key={version.id}
                        className="bg-white/90 rounded-lg border border-green-200/50 overflow-hidden shadow-sm"
                      >
                        <Link
                          href={`/prototypes/${version.id}/versions/${version.id}/play`}
                          className="block p-3 hover:bg-green-50/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-green-100 rounded-md">
                              <HiPuzzlePiece className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-green-800 text-sm">
                                {formatDate(version.createdAt, true)}版
                              </h4>
                              <p className="text-xs text-green-700/70">
                                初期配置を準備
                              </p>
                            </div>
                          </div>
                        </Link>

                        {/* このバージョンのルーム */}
                        <div className="bg-green-50/30 px-3 pb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-4 h-4 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center">
                              <span className="text-xs font-bold text-orange-600">
                                3
                              </span>
                            </div>
                            <span className="text-xs font-medium text-orange-700">
                              プレイルーム
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {prototypeInfo.instancesByVersion[version.id]?.map(
                              (instance) => (
                                <Link
                                  key={instance.id}
                                  href={`/prototypes/${instance.id}/instances/${instance.id}/play`}
                                  className="group"
                                  title={`${instance.name} (Room ${instance.versionNumber})`}
                                >
                                  <div className="bg-white border border-orange-200 hover:border-orange-300 rounded-lg p-2 transition-all min-w-[60px] text-center group-hover:shadow-sm">
                                    <MdMeetingRoom className="h-4 w-4 text-orange-600 mx-auto mb-1" />
                                    <span className="text-xs font-medium text-orange-700 block">
                                      R{instance.versionNumber}
                                    </span>
                                  </div>
                                </Link>
                              )
                            )}

                            {/* ルーム作成ボタン */}
                            <button
                              onClick={() => handleCreateRoom(version.id)}
                              className="group min-w-[60px]"
                              title="新しいルーム作成"
                            >
                              <div className="bg-white/60 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-white/80 rounded-lg p-2 transition-all text-center">
                                <IoAdd className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                                <span className="text-xs font-medium text-orange-600/80 block">
                                  作成
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
