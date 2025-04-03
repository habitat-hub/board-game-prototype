'use client';

import { AxiosResponse } from 'axios';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoArrowBack } from 'react-icons/io5';

import { VERSION_NUMBER } from '@/features/prototype/const';
import { Prototype, PrototypeVersion } from '@/types';
import { PrototypesGroupsDetailData } from '@/types/data-contracts';
import axiosInstance from '@/utils/axiosInstance';
import formatDate from '@/utils/dateFormat';

const GroupPrototypeList: React.FC = () => {
  const router = useRouter();
  // グループID
  const groupId = useParams().groupId;

  const [prototype, setPrototype] = useState<{
    // 編集版プロトタイプ
    edit: {
      prototype: Prototype;
      versions: PrototypeVersion[];
    } | null;
    // プレビュー版プロトタイプ
    preview: {
      prototype: Prototype;
      versions: PrototypeVersion[];
    }[];
  } | null>(null);

  /**
   * プロトタイプを取得する
   */
  const getPrototypeGroups = useCallback(async () => {
    const response: AxiosResponse<PrototypesGroupsDetailData> =
      await axiosInstance.get(`/api/prototypes/groups/${groupId}`);
    const prototypes = response.data;

    // 編集版プロトタイプ
    const edit = prototypes.find((p) => p.prototype.type === 'EDIT');
    // プレビュー版プロトタイプ
    const previews = prototypes.filter((p) => p.prototype.type === 'PREVIEW');

    setPrototype({
      edit: edit || null,
      preview: previews,
    });
  }, [groupId]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypeGroups();
  }, [getPrototypeGroups]);

  /**
   * プレビュー版プロトタイプを作成する
   * @param prototypeVersionId プレビュー版プロトタイプのID
   */
  const handleCreatePreviewPrototype = async (prototypeVersionId: string) => {
    await axiosInstance.post(`/api/prototypes/${prototypeVersionId}/preview`);
    await getPrototypeGroups();
  };

  /**
   * 新しいルームを作成する
   * @param prototypeId プロトタイプのID
   * @param prototypeVersionId プロトタイプのバージョンのID
   * @param versions プロトタイプのバージョン
   */
  const handleCreateRoom = async (
    prototypeId: string,
    prototypeVersionId: string,
    versions: PrototypeVersion[]
  ) => {
    // 新しいバージョン番号
    const newVersionNumber = versions.length.toString() + '.0.0';

    await axiosInstance.post(
      `/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`,
      {
        newVersionNumber,
        description: null,
      }
    );
    await getPrototypeGroups();
  };

  // プロトタイプが存在しない場合
  if (!prototype) return null;

  return (
    <div className="max-w-4xl mx-auto mt-16 relative pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/prototypes')}
          className="p-2 hover:bg-content-secondary rounded-full transition-colors"
          title="プロトタイプ一覧へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
        </button>
        <h1 className="text-2xl font-bold text-center flex-grow bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
          {prototype.edit?.prototype.name}
        </h1>
      </div>

      {/* 編集版 */}
      {prototype.edit && (
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-wood-darkest">編集版</h2>
          <div className="shadow-xl rounded-2xl overflow-hidden bg-content border border-wood-lightest/20">
            <Link
              href={`/prototypes/${prototype.edit.prototype.id}/versions/${prototype.edit.versions[0].id}/edit`}
            >
              <div className="hover:bg-content-secondary/50 transition-colors duration-200 flex justify-between items-center p-4">
                <span className="text-wood-darkest">Master版</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();

                    if (!prototype.edit) return;
                    handleCreatePreviewPrototype(prototype.edit.prototype.id);
                  }}
                  disabled={!prototype.edit}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-wood-dark hover:text-header rounded-lg hover:bg-wood-lightest/20 transition-all duration-200 border border-wood-light/20"
                  title="プレビュー版を作成"
                >
                  <IoAdd className="h-4 w-4" />
                  プレビュー
                </button>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* プレビュー版 */}
      {prototype.preview.map(({ prototype, versions }, index) => (
        <div key={prototype.id} className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-wood-darkest">
            プレビュー版 {index + 1}
          </h2>
          <div className="shadow-xl rounded-2xl overflow-hidden bg-content border border-wood-lightest/20">
            <div className="bg-content-secondary border-b border-wood-lightest/30">
              <div className="flex items-center p-4 text-sm font-medium text-wood-dark">
                <span className="flex-1">バージョン</span>
                <span className="w-32">作成日</span>
                <div className="w-32" />
              </div>
            </div>
            <ul className="divide-y divide-wood-lightest/20">
              {versions.map((version) => (
                <Link
                  key={version.id}
                  href={`/prototypes/${version.prototypeId}/versions/${version.id}/play`}
                >
                  <li className="hover:bg-content-secondary/50 transition-colors duration-200 flex justify-between items-center p-4">
                    <div className="flex-1 flex items-center gap-2 text-wood-darkest">
                      <span className="font-medium">
                        {version.versionNumber === VERSION_NUMBER.MASTER
                          ? 'Ver.'
                          : 'Room'}{' '}
                        {version.versionNumber}
                      </span>
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <span className="px-2 py-0.5 text-xs bg-content-secondary text-wood-dark rounded-full border border-wood-light/30">
                          Master
                        </span>
                      )}
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <span className="px-2 py-0.5 text-xs bg-wood-lightest/30 text-wood-dark rounded-full border border-wood-light/30">
                          編集不可
                        </span>
                      )}
                    </div>
                    <span className="w-32 text-sm text-wood">
                      {formatDate(version.createdAt, true)}
                    </span>
                    <div className="w-32">
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleCreateRoom(
                              version.prototypeId,
                              version.id,
                              versions
                            );
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-wood-dark hover:text-header rounded-lg hover:bg-wood-lightest/20 transition-all duration-200 border border-wood-light/20"
                          title="新しいルームを作成"
                        >
                          <IoAdd className="h-4 w-4" />
                          ルーム
                        </button>
                      )}
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupPrototypeList;
