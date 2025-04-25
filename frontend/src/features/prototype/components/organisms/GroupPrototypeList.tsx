'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { FaCheck, FaPenToSquare } from 'react-icons/fa6';
import { IoAdd, IoArrowBack, IoTrash } from 'react-icons/io5';
import { TbCards } from 'react-icons/tb';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, PrototypeVersion } from '@/api/types';
import { VERSION_NUMBER } from '@/features/prototype/const';
import formatDate from '@/utils/dateFormat';

const GroupPrototypeList: React.FC = () => {
  const router = useRouter();
  const {
    getPrototypesByGroup,
    createPreview,
    createVersion,
    deletePrototype,
    deleteVersion,
    updatePrototype,
  } = usePrototypes();

  // グループID
  const { groupId } = useParams<{ groupId: string }>();

  // 編集中のプロトタイプ名を管理するState
  const [nameEditingId, setNameEditingId] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');

  // プレイ人数編集を管理するState
  const [playersEditingId, setPlayersEditingId] = useState<string>('');
  const [editedMinPlayers, setEditedMinPlayers] = useState<number>(2);
  const [editedMaxPlayers, setEditedMaxPlayers] = useState<number>(4);

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
    const response = await getPrototypesByGroup(groupId);
    const prototypes = response;

    // 編集版プロトタイプ
    const edit = prototypes.find((p) => p.prototype.type === 'EDIT');
    // プレビュー版プロトタイプ
    const previews = prototypes.filter((p) => p.prototype.type === 'PREVIEW');

    setPrototype({
      edit: edit || null,
      preview: previews,
    });
  }, [getPrototypesByGroup, groupId]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypeGroups();
  }, [getPrototypeGroups]);

  /**
   * プレビュー版プロトタイプを作成する
   * @param prototypeVersionId プレビュー版プロトタイプのID
   */
  const handleCreatePreviewPrototype = async (prototypeVersionId: string) => {
    await createPreview(prototypeVersionId);
    await getPrototypeGroups();
  };

  /**
   * 新しいルームを作成する
   * @param prototypeId プロトタイプのID
   * @param prototypeVersionId プロトタイプのバージョンのID
   */
  const handleCreateRoom = async (
    prototypeId: string,
    prototypeVersionId: string
  ) => {
    await createVersion(prototypeId, prototypeVersionId, {
      description: undefined,
    });
    await getPrototypeGroups();
  };

  /**
   * プレビューを削除する
   * @param prototypeId プロトタイプのID
   */
  const handleDeletePreview = async (prototypeId: string) => {
    await deletePrototype(prototypeId);
    await getPrototypeGroups();
  };

  /**
   * ルームを削除する
   * @param prototypeId プロトタイプのID
   * @param prototypeVersionId プロトタイプのバージョンのID
   */
  const handleDeleteRoom = async (
    prototypeId: string,
    prototypeVersionId: string
  ) => {
    await deleteVersion(prototypeId, prototypeVersionId);
    await getPrototypeGroups();
  };

  /**
   * プロトタイプ名の編集モードを切り替える関数
   * @param id プロトタイプID
   * @param name プロトタイプ名
   */
  const handleNameEditToggle = (id: string, name: string) => {
    if (nameEditingId === id) {
      // 同じ項目を再度押した場合は編集モードを解除
      setNameEditingId('');
    } else {
      // 編集モードにする
      setNameEditingId(id);
      setEditedName(name);
    }
  };

  /**
   * プロトタイプ名の編集を完了する処理
   */
  const handleNameEditComplete = async () => {
    try {
      // 編集中のプロトタイプがない場合は処理を終了
      if (!prototype?.edit || !nameEditingId) return;

      const prototypeToEdit = prototype.edit.prototype;

      // プロトタイプ名を更新
      await updatePrototype(nameEditingId, {
        name: editedName,
        minPlayers: prototypeToEdit.minPlayers,
        maxPlayers: prototypeToEdit.maxPlayers,
      });

      // 一覧を更新
      await getPrototypeGroups();
    } catch (error) {
      console.error('Error updating prototype name:', error);
    } finally {
      // 編集モードを解除
      setNameEditingId('');
    }
  };

  /**
   * プレイ人数の編集モードを切り替える関数
   * @param id プロトタイプID
   * @param minPlayers 最小プレイヤー数
   * @param maxPlayers 最大プレイヤー数
   */
  const handlePlayersEditToggle = (
    id: string,
    minPlayers: number,
    maxPlayers: number
  ) => {
    if (playersEditingId === id) {
      // 同じ項目を再度押した場合は編集モードを解除
      setPlayersEditingId('');
    } else {
      // 編集モードにする
      setPlayersEditingId(id);
      setEditedMinPlayers(minPlayers);
      setEditedMaxPlayers(maxPlayers);
    }
  };

  /**
   * プレイ人数の編集を完了する処理
   */
  const handlePlayersEditComplete = async () => {
    try {
      // 編集中のプロトタイプがない場合は処理を終了
      if (!prototype?.edit || !playersEditingId) return;

      const prototypeToEdit = prototype.edit.prototype;

      // プレイヤー人数のバリデーション
      if (editedMinPlayers < 1) {
        alert('最小プレイヤー数は1人以上に設定してください');
        return;
      }
      if (editedMaxPlayers < editedMinPlayers) {
        alert('最大プレイヤー数は最小プレイヤー数以上に設定してください');
        return;
      }

      // プロトタイプのプレイ人数を更新
      await updatePrototype(playersEditingId, {
        name: prototypeToEdit.name,
        minPlayers: editedMinPlayers,
        maxPlayers: editedMaxPlayers,
      });

      // 一覧を更新
      await getPrototypeGroups();
    } catch (error) {
      console.error('Error updating player count:', error);
    } finally {
      // 編集モードを解除
      setPlayersEditingId('');
    }
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

        {prototype.edit && nameEditingId === prototype.edit.prototype.id ? (
          <form
            className="flex-grow flex items-center justify-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleNameEditComplete();
            }}
          >
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-center text-2xl font-bold py-2 px-4 border border-wood-light/30 rounded-lg bg-white w-[80%]"
              autoFocus
            />
            <button
              type="submit"
              className="ml-3 p-2 text-green-600 hover:text-green-700 rounded-md border border-green-500 hover:bg-green-50 transition-colors"
              title="編集完了"
            >
              <FaCheck className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-header via-header-light to-header text-transparent bg-clip-text">
              {prototype.edit?.prototype.name}
            </h1>
            {prototype.edit && (
              <button
                onClick={() =>
                  prototype.edit &&
                  handleNameEditToggle(
                    prototype.edit.prototype.id,
                    prototype.edit.prototype.name
                  )
                }
                className="ml-3 p-2 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors"
                title="プロトタイプ名を編集"
              >
                <FaPenToSquare className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* プロトタイプの基本情報 */}
      {prototype.edit && (
        <div className="mb-6 overflow-hidden border border-wood-lightest/20 rounded-xl bg-content">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-wood-lightest/20">
                <th className="px-4 py-3 text-left bg-content-secondary text-wood-darkest w-36">
                  プレイヤー人数
                </th>
                <td className="px-4 py-3 text-wood-dark">
                  {prototype.edit &&
                  playersEditingId === prototype.edit.prototype.id ? (
                    <form
                      className="flex items-center"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePlayersEditComplete();
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          value={editedMinPlayers}
                          onChange={(e) =>
                            setEditedMinPlayers(Number(e.target.value))
                          }
                          className="w-16 py-1 px-2 border border-wood-light/30 rounded-lg bg-white text-center"
                          autoFocus
                        />
                        <span className="mx-2">〜</span>
                        <input
                          type="number"
                          min="1"
                          value={editedMaxPlayers}
                          onChange={(e) =>
                            setEditedMaxPlayers(Number(e.target.value))
                          }
                          className="w-16 py-1 px-2 border border-wood-light/30 rounded-lg bg-white text-center"
                        />
                        <span className="ml-1">人</span>
                      </div>
                      <button
                        type="submit"
                        className="ml-3 p-1.5 text-green-600 hover:text-green-700 rounded-md border border-green-500 hover:bg-green-50 transition-colors"
                        title="編集完了"
                      >
                        <FaCheck className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center">
                      <span>
                        {prototype.edit.prototype.minPlayers ===
                        prototype.edit.prototype.maxPlayers
                          ? `${prototype.edit.prototype.minPlayers}人`
                          : `${prototype.edit.prototype.minPlayers}〜${prototype.edit.prototype.maxPlayers}人`}
                      </span>
                      <button
                        onClick={() =>
                          prototype.edit &&
                          handlePlayersEditToggle(
                            prototype.edit.prototype.id,
                            prototype.edit.prototype.minPlayers,
                            prototype.edit.prototype.maxPlayers
                          )
                        }
                        className="ml-3 p-1.5 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-colors"
                        title="プレイヤー人数を編集"
                      >
                        <FaPenToSquare className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
              <tr className="border-b border-wood-lightest/20">
                <th className="px-4 py-3 text-left bg-content-secondary text-wood-darkest w-36">
                  作成日時
                </th>
                <td className="px-4 py-3 text-wood-dark">
                  {formatDate(prototype.edit.prototype.createdAt, true)}
                </td>
              </tr>
              <tr className="border-b border-wood-lightest/20">
                <th className="px-4 py-3 text-left bg-content-secondary text-wood-darkest w-36">
                  最終更新日時
                </th>
                <td className="px-4 py-3 text-wood-dark">
                  {formatDate(prototype.edit.prototype.updatedAt, true)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 編集版 */}
      {prototype.edit && (
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-4">
              {/* プロトタイプを編集するボタン */}
              <button
                onClick={() => {
                  if (!prototype.edit) return;
                  router.push(
                    `/prototypes/${prototype.edit.prototype.id}/versions/${prototype.edit.versions[0].id}/edit`
                  );
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-wood-dark bg-white hover:text-header rounded-lg hover:bg-wood-lightest transition-all duration-200 border border-wood-light shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                title="プロトタイプを編集"
              >
                <TbCards className="h-5 w-5" />
                プロトタイプを編集する
              </button>

              {/* プロトタイプを遊ぶボタン */}
              <button
                onClick={() => {
                  if (!prototype.edit) return;
                  handleCreatePreviewPrototype(prototype.edit.prototype.id);
                }}
                disabled={!prototype.edit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-wood-dark bg-white hover:text-header rounded-lg hover:bg-wood-lightest transition-all duration-200 border border-wood-light shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                title="プレビュー版を作成"
              >
                <IoAdd className="h-5 w-5" />
                プロトタイプを遊ぶ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プレビュー版 */}
      {prototype.preview.map(({ prototype, versions }) => (
        <div key={prototype.id} className="mb-8">
          <h2 className="text-lg font-medium mb-4 text-wood-darkest">
            {prototype.name}
            <span className="text-sm font-medium text-wood-dark ml-2">
              {prototype.id.substring(0, 6)}
            </span>
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
                    <div className="w-40 flex gap-2 justify-end">
                      {version.versionNumber === VERSION_NUMBER.MASTER && (
                        <>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleCreateRoom(version.prototypeId, version.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-wood-dark hover:text-header rounded-lg hover:bg-wood-lightest/20 transition-all duration-200 border border-wood-light/20"
                            title="新しいルームを作成"
                          >
                            <IoAdd className="h-4 w-4" />
                            ルーム
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeletePreview(version.prototypeId);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-wood-dark hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 border border-wood-light/20"
                            title="プレビューを削除"
                          >
                            <IoTrash className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {version.versionNumber !== VERSION_NUMBER.MASTER && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteRoom(version.prototypeId, version.id);
                          }}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-wood-dark hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200 border border-wood-light/20"
                          title="ルームを削除"
                        >
                          <IoTrash className="h-4 w-4" />
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
