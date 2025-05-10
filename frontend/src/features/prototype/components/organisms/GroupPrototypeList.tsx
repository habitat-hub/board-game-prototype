'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FaCheck,
  FaPenToSquare,
  FaEye,
  FaCopy,
  FaUsers,
} from 'react-icons/fa6';
import { HiOutlinePencilAlt } from 'react-icons/hi';
import { IoAdd, IoArrowBack, IoTrash } from 'react-icons/io5';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Prototype, PrototypeVersion, User } from '@/api/types';
import AccessUsersCard from '@/features/prototype/components/molecules/AccessUsersCard';
import CreateVersionButton from '@/features/prototype/components/molecules/CreateVersionButton';
import PlayRoomCard from '@/features/prototype/components/molecules/PlayRoomCard';
import {
  VERSION_NUMBER,
  PLAYERS_MIN,
  PLAYERS_MAX,
} from '@/features/prototype/const';
import { useUser } from '@/hooks/useUser';
import formatDate from '@/utils/dateFormat';

const GroupPrototypeList: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const {
    getPrototypesByGroup,
    createPreview,
    createVersion,
    deletePrototype,
    deleteVersion,
    updatePrototype,
    getAccessUsersByGroup,
    duplicatePrototype,
  } = usePrototypes();

  // グループID
  const { groupId } = useParams<{ groupId: string }>();

  // 編集中のプロトタイプ名を管理するState
  const [nameEditingId, setNameEditingId] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');

  // プレイヤー人数編集を管理するState
  const [playersEditingId, setPlayersEditingId] = useState<string>('');
  const [editedMinPlayers, setEditedMinPlayers] = useState<number>(4);
  const [editedMaxPlayers, setEditedMaxPlayers] = useState<number>(4);

  // 参加ユーザーのリスト
  const [accessUsers, setAccessUsers] = useState<User[]>([]);

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

  /**
   * グループの参加ユーザーを取得する
   */
  const fetchAccessUsers = useCallback(async () => {
    try {
      const users = await getAccessUsersByGroup(groupId);
      setAccessUsers(users);
    } catch (error) {
      console.error('Error fetching access users:', error);
    }
  }, [getAccessUsersByGroup, groupId]);

  // プロトタイプを取得する
  useEffect(() => {
    getPrototypeGroups();
    fetchAccessUsers();
  }, [getPrototypeGroups, fetchAccessUsers]);

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

      if (editedName.trim() === '') {
        alert('プロトタイプ名を入力してください');
        return;
      }

      // プロトタイプ名を更新
      await updatePrototype(nameEditingId, {
        name: editedName,
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
   * プレイヤー人数の編集モードを切り替える関数
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
   * プレイヤー人数の編集を完了する処理
   */
  const handlePlayersEditComplete = async () => {
    try {
      // 編集中のプロトタイプがない場合は処理を終了
      if (!prototype?.edit || !playersEditingId) return;

      const prototypeToEdit = prototype.edit.prototype;

      // プレイヤー人数のバリデーション
      if (editedMinPlayers < PLAYERS_MIN || editedMinPlayers > PLAYERS_MAX) {
        alert(
          `最小プレイヤー数は${PLAYERS_MIN}人以上、${PLAYERS_MAX}人以下に設定してください`
        );
        return;
      }
      if (
        editedMaxPlayers < editedMinPlayers ||
        editedMaxPlayers > PLAYERS_MAX
      ) {
        alert(
          `最大プレイヤー数は最小プレイヤー数以上、${PLAYERS_MAX}人以下に設定してください`
        );
        return;
      }

      // プロトタイプのプレイヤー人数を更新
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

  /**
   * プロトタイプを複製する
   * @param prototypeId プロトタイプID
   */
  const handleDuplicate = async (prototypeId: string) => {
    try {
      await duplicatePrototype(prototypeId);
      router.push('/prototypes'); // 複製後はプロトタイプ一覧へ
    } catch (error) {
      console.error('Error duplicating prototype:', error);
    }
  };

  // プロトタイプが存在しない場合
  if (!prototype || !prototype.edit) return null;

  return (
    <div className="max-w-4xl mx-auto mt-16 relative">
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
                title="プロトタイプ名編集"
              >
                <FaPenToSquare className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* このプロトタイプについて */}
      <div className="mb-6 p-6 overflow-visible rounded-xl bg-gradient-to-r from-content via-content to-content-secondary shadow-lg border border-wood-lightest/30">
        <h2 className="text-xl font-bold text-wood-darkest mb-4 border-b border-wood-light/30 pb-2 flex justify-between items-center">
          <span>このプロトタイプについて</span>
          {prototype.edit && (
            <div className="flex items-center gap-2">
              {user?.id === prototype.edit.prototype.userId ? (
                <>
                  <button
                    onClick={() =>
                      prototype.edit &&
                      handleDuplicate(prototype.edit.prototype.id)
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/70 text-wood-dark hover:text-header rounded-md hover:bg-white transition-colors border border-wood-light/30"
                    title="プロトタイプ複製"
                  >
                    <FaCopy className="w-4 h-4" />
                    <span>複製</span>
                  </button>
                  <button
                    onClick={() =>
                      prototype.edit &&
                      router.push(
                        `/prototypes/${prototype.edit.prototype.id}/delete`
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/70 text-wood-dark hover:text-red-600 rounded-md hover:bg-white transition-colors border border-wood-light/30"
                    title="プロトタイプ削除"
                  >
                    <IoTrash className="w-4 h-4" />
                    <span>削除</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/40 text-wood-light/50 cursor-not-allowed rounded-md border border-wood-light/20"
                    title="プロトタイプのオーナーのみが複製できます"
                  >
                    <FaCopy className="w-4 h-4" />
                    <span>複製</span>
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/40 text-wood-light/50 cursor-not-allowed rounded-md border border-wood-light/20"
                    title="プロトタイプのオーナーのみが削除できます"
                  >
                    <IoTrash className="w-4 h-4" />
                    <span>削除</span>
                  </button>
                </>
              )}
            </div>
          )}
        </h2>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white/80 rounded-xl p-5 shadow-inner border border-wood-lightest/40">
            <h3 className="text-sm uppercase tracking-wide text-wood-dark/70 mb-2 font-medium">
              プレイヤー人数
            </h3>

            {prototype.edit &&
            playersEditingId === prototype.edit.prototype.id ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePlayersEditComplete();
                }}
              >
                <input
                  type="number"
                  value={editedMinPlayers === 0 ? '' : editedMinPlayers}
                  onChange={(e) =>
                    setEditedMinPlayers(
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  className="w-16 p-1 border border-wood-light rounded"
                  autoFocus
                  min={PLAYERS_MIN}
                  max={PLAYERS_MAX}
                />
                <span>~</span>
                <input
                  type="number"
                  value={editedMaxPlayers === 0 ? '' : editedMaxPlayers}
                  onChange={(e) =>
                    setEditedMaxPlayers(
                      e.target.value === '' ? 0 : Number(e.target.value)
                    )
                  }
                  className="w-16 p-1 border border-wood-light rounded"
                  min={PLAYERS_MIN}
                  max={PLAYERS_MAX}
                />
                <span className="text-wood-dark">人</span>
                <button
                  type="submit"
                  className="ml-2 p-1.5 text-green-600 hover:text-green-700 rounded-md border border-green-500 hover:bg-green-50 transition-colors"
                  title="編集完了"
                >
                  <FaCheck className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center">
                <FaUsers className="h-4 w-4 mr-2 text-wood-dark" />
                <span className="text-2xl font-semibold text-wood-darkest">
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
                  className="ml-3 p-1.5 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-all"
                  title="プレイヤー人数編集"
                >
                  <FaPenToSquare className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 参加ユーザーカード */}
          <AccessUsersCard
            accessUsers={accessUsers}
            groupId={groupId}
            prototypeOwnerId={prototype.edit?.prototype.userId}
          />

          {/* 作成日時カード - クリック不可でホバーエフェクトなし */}
          <div className="flex-1 bg-white/80 rounded-xl p-5 shadow-inner border border-wood-lightest/40">
            <h3 className="text-sm uppercase tracking-wide text-wood-dark/70 mb-2 font-medium">
              作成日時
            </h3>
            <p className="text-2xl font-semibold text-wood-darkest">
              {formatDate(prototype.edit.prototype.createdAt, true)}
            </p>
          </div>
        </div>

        {/* プロトタイプ編集ボタン */}
        <div className="flex flex-col gap-4 mt-6">
          <button
            onClick={() => {
              if (!prototype.edit) return;
              router.push(
                `/prototypes/${prototype.edit.prototype.id}/versions/${prototype.edit.versions[0].id}/edit`
              );
            }}
            className="bg-gradient-to-r from-header/90 to-header-light/90 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-header/20 group w-full"
            title="プロトタイプ編集"
          >
            <div className="flex items-center justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
                <HiOutlinePencilAlt className="h-6 w-6 text-header group-hover:text-header-light transition-colors" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-white group-hover:text-white transition-colors text-lg">
                  プロトタイプ編集
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* プレイルーム */}
      <div className="mt-12">
        <div className="bg-wood-lightest/30 rounded-xl p-5 mb-6 border border-wood-light/30 shadow-md">
          <h2 className="text-xl font-bold text-wood-darkest mb-4 border-b border-wood-light/30 pb-2">
            プレイルーム
          </h2>
          <div className="flex justify-start w-full mb-6">
            <CreateVersionButton
              onClick={() => {
                if (!prototype.edit) return;
                handleCreatePreviewPrototype(prototype.edit.prototype.id);
              }}
            />
          </div>

          {prototype.preview.length === 0 ? (
            <div className="text-center py-8 text-wood-dark">
              <p className="mb-2">バージョン・プレイルームがありません</p>
            </div>
          ) : (
            [...prototype.preview]
              .sort(
                (a, b) =>
                  new Date(b.prototype.createdAt).getTime() -
                  new Date(a.prototype.createdAt).getTime()
              )
              .map(({ prototype, versions }) => (
                <div key={prototype.id} className="mb-8">
                  <div className="bg-gradient-to-br from-content to-content-secondary rounded-2xl shadow-lg border border-wood-lightest/30 p-5">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-wood-light/30">
                      {nameEditingId === prototype.id ? (
                        <form
                          className="flex items-center"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleNameEditComplete();
                          }}
                        >
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="py-2 px-3 border border-wood-light/30 rounded-lg bg-white w-full"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="ml-3 p-1.5 text-green-600 hover:text-green-700 rounded-md border border-green-500 hover:bg-green-50 transition-colors"
                            title="編集完了"
                          >
                            <FaCheck className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <h3 className="font-medium text-wood-darkest flex items-center">
                          <span>{prototype.name}</span>
                          <button
                            onClick={() =>
                              handleNameEditToggle(prototype.id, prototype.name)
                            }
                            className="ml-2 p-1.5 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-all"
                            title="バージョン名編集"
                          >
                            <FaPenToSquare className="w-3.5 h-3.5" />
                          </button>
                        </h3>
                      )}
                      <div className="flex gap-2 items-center">
                        {/* プレイヤー人数表示 */}
                        <div className="text-sm text-wood-dark bg-wood-lightest/70 px-2 py-0.5 rounded-md border border-wood-light/20 flex items-center">
                          <FaUsers className="h-3 w-3 mr-1" />
                          <span>
                            {prototype.minPlayers === prototype.maxPlayers
                              ? `${prototype.minPlayers}人`
                              : `${prototype.minPlayers}〜${prototype.maxPlayers}人`}
                          </span>
                        </div>
                        {versions.some(
                          (v) => v.versionNumber === VERSION_NUMBER.MASTER
                        ) && (
                          <>
                            <Link
                              href={`/prototypes/${prototype.id}/versions/${versions.find((v) => v.versionNumber === VERSION_NUMBER.MASTER)?.id}/play`}
                              className="p-1.5 text-wood hover:text-header rounded-md hover:bg-wood-lightest/20 transition-all"
                              title="バージョンプレビュー"
                            >
                              <FaEye className="h-4 w-4" />
                            </Link>
                            {user?.id === prototype.userId ? (
                              <button
                                onClick={() =>
                                  handleDeletePreview(prototype.id)
                                }
                                className="p-1.5 text-wood hover:text-red-500 rounded-md hover:bg-red-50/20 transition-all"
                                title="バージョン削除"
                              >
                                <IoTrash className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="p-1.5 text-wood-light/50 cursor-not-allowed rounded-md"
                                title="プロトタイプのオーナーのみが削除できます"
                              >
                                <IoTrash className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {versions.some(
                      (v) => v.versionNumber !== VERSION_NUMBER.MASTER
                    ) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {versions.map((version) => {
                          // Skip rendering master version
                          if (version.versionNumber === VERSION_NUMBER.MASTER) {
                            return null;
                          }

                          return (
                            <PlayRoomCard
                              key={version.id}
                              version={version}
                              onDelete={handleDeleteRoom}
                              prototype={prototype}
                            />
                          );
                        })}

                        {/* 新しいルームを作成する空のカード */}
                        <button
                          onClick={() => {
                            const masterVersion = versions.find(
                              (v) => v.versionNumber === VERSION_NUMBER.MASTER
                            );
                            if (masterVersion) {
                              handleCreateRoom(prototype.id, masterVersion.id);
                            }
                          }}
                          aria-label="新しいルーム作成"
                          className="cursor-pointer"
                        >
                          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-dashed border-wood-light/60 group h-full">
                            <div className="flex flex-col items-center justify-center h-full p-6">
                              <div className="w-12 h-12 rounded-full bg-wood-lightest/50 flex items-center justify-center mb-2 group-hover:bg-wood-lightest transition-colors">
                                <IoAdd className="h-6 w-6 text-wood-dark group-hover:text-header transition-colors" />
                              </div>
                              <h3 className="font-medium text-wood-dark group-hover:text-header transition-colors">
                                新しいルーム作成
                              </h3>
                            </div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* 新しいルームを作成する空のカード - プレイルームが無い場合 */}
                        <button
                          onClick={() => {
                            const masterVersion = versions.find(
                              (v) => v.versionNumber === VERSION_NUMBER.MASTER
                            );
                            if (masterVersion) {
                              handleCreateRoom(prototype.id, masterVersion.id);
                            }
                          }}
                          aria-label="新しいルーム作成"
                          className="cursor-pointer"
                        >
                          <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-dashed border-wood-light/60 group h-full">
                            <div className="flex flex-col items-center justify-center h-full p-6">
                              <div className="w-12 h-12 rounded-full bg-wood-lightest/50 flex items-center justify-center mb-2 group-hover:bg-wood-lightest transition-colors">
                                <IoAdd className="h-6 w-6 text-wood-dark group-hover:text-header transition-colors" />
                              </div>
                              <h3 className="font-medium text-wood-dark group-hover:text-header transition-colors">
                                新しいルーム作成
                              </h3>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupPrototypeList;
