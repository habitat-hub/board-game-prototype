'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { IoAdd, IoArrowBack } from 'react-icons/io5';

import axiosInstance from '@/utils/axiosInstance';
import { PROTOTYPE_TYPE, VERSION_NUMBER } from '@/features/prototype/const';
import { Prototype, PrototypeVersion } from '@/types/models';

const GroupPrototypeList: React.FC = () => {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const groupId = useParams().groupId;
  const [editPrototype, setEditPrototype] = useState<{
    prototype: Prototype;
    versions: PrototypeVersion[];
  } | null>(null);
  const [previewPrototypes, setPreviewPrototypes] = useState<
    {
      prototype: Prototype;
      versions: PrototypeVersion[];
    }[]
  >([]);

  const getPrototypeGroups = useCallback(async () => {
    const response = await axiosInstance.get(
      `${apiUrl}/api/prototypes/groups/${groupId}`
    );
    const prototypes = response.data;

    // 編集版
    const edit = prototypes.find(
      (p: { prototype: Prototype }) => p.prototype.type === PROTOTYPE_TYPE.EDIT
    );
    setEditPrototype(edit || null);

    // プレビュー版
    const previews = prototypes.filter(
      (p: { prototype: Prototype }) =>
        p.prototype.type === PROTOTYPE_TYPE.PREVIEW
    );
    setPreviewPrototypes(previews);
  }, [apiUrl, groupId]);

  const handleCreatePreviewPrototype = async (prototypeVersionId: string) => {
    await axiosInstance.post(
      `${apiUrl}/api/prototypes/${prototypeVersionId}/preview`
    );
    await getPrototypeGroups();
  };

  const handleCreateRoom = async (
    prototypeId: string,
    prototypeVersionId: string,
    versions: PrototypeVersion[]
  ) => {
    const newVersionNumber = versions.length.toString() + '.0.0';

    await axiosInstance.post(
      `${apiUrl}/api/prototypes/${prototypeId}/versions/${prototypeVersionId}`,
      {
        newVersionNumber,
        description: null,
      }
    );
    await getPrototypeGroups();
  };

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypeGroups();
  }, [getPrototypeGroups]);

  if (!editPrototype && Object.keys(previewPrototypes).length === 0)
    return null;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/prototypes')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="プロトタイプ一覧へ戻る"
        >
          <IoArrowBack className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-center flex-grow">
          {editPrototype?.prototype.name}
        </h1>
      </div>

      {/* 編集版 */}
      {editPrototype && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">編集版</h2>
          <div className="shadow-lg rounded-lg overflow-hidden">
            <Link
              href={`/prototypes/${editPrototype.prototype.id}/versions/${editPrototype.versions[0].id}/edit`}
            >
              <div className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4 border border-gray-200">
                <span>Master版</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleCreatePreviewPrototype(editPrototype.prototype.id);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                >
                  <IoAdd className="h-4 w-4" />
                  プレビュー版を作成
                </button>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* プレビュー版 */}
      {previewPrototypes.map(({ prototype, versions }, index) => (
        <div key={prototype.id} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            プレビュー版 {index + 1} （作成日：
            {new Date(versions[0].createdAt).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
            ）
          </h2>
          <div className="shadow-lg rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {versions.map((version) => (
                <Link
                  key={version.id}
                  href={`/prototypes/${version.prototypeId}/versions/${version.id}/play`}
                >
                  <li className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span>
                        {version.versionNumber === VERSION_NUMBER.MASTER
                          ? 'Version'
                          : 'Room'}{' '}
                        {version.versionNumber}
                      </span>
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-600">
                          Master
                        </span>
                      )}
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-600 rounded-full border border-yellow-600">
                          編集不可
                        </span>
                      )}
                    </div>
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
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600"
                      >
                        <IoAdd className="h-4 w-4" />
                        ルームを作成
                      </button>
                    )}
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
