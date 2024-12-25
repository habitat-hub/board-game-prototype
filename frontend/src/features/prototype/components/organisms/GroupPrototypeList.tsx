'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Prototype, PrototypeVersion } from '@/features/prototype/type';
import axiosInstance from '@/utils/axiosInstance';
import { PROTOTYPE_TYPE, VERSION_NUMBER } from '@/features/prototype/const';

const GroupPrototypeList: React.FC = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const groupId = useParams().groupId;
  const [groupPrototypes, setGroupPrototypes] = useState<
    {
      prototype: Prototype;
      versions: PrototypeVersion[];
    }[]
  >([]);

  // プロトタイプを取得する
  useEffect(() => {
    axiosInstance
      .get(`${apiUrl}/api/prototypes/groups/${groupId}`)
      .then((response) => setGroupPrototypes(response.data))
      .catch((error) => console.error('Error fetching prototypes:', error));
  }, [apiUrl, groupId]);

  if (groupPrototypes.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-8 text-center">
        {groupPrototypes[0].prototype.name}
      </h1>
      <div className="shadow-lg rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {groupPrototypes.map(({ prototype, versions }) => {
            return versions.map(({ id: versionId, versionNumber }) => {
              return (
                <Link
                  key={prototype.id}
                  href={`/prototypes/${prototype.id}/versions/${versionId}/${
                    prototype.type === PROTOTYPE_TYPE.EDIT ? 'edit' : 'preview'
                  }`}
                >
                  <li className="hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center p-4">
                    <span className="flex-1">
                      {prototype.type === PROTOTYPE_TYPE.EDIT
                        ? '編集版'
                        : `プレビュー版 Version${versionNumber}`}
                    </span>
                    {prototype.type === PROTOTYPE_TYPE.PREVIEW &&
                      versionNumber === VERSION_NUMBER.MASTER && (
                        <div className="flex space-x-2 ml-auto">編集不可</div>
                      )}
                  </li>
                </Link>
              );
            });
          })}
        </ul>
      </div>
    </div>
  );
};

export default GroupPrototypeList;
