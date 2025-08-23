/**
 * @page パーツ編集ページに表示するパーツのプロパティを編集するメニュー
 */

'use client';

import axios from 'axios';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BiArea } from 'react-icons/bi';
import { FaRegCopy, FaRegTrashAlt, FaImage, FaSpinner } from 'react-icons/fa';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';

import { useImages } from '@/api/hooks/useImages';
import { Part, PartProperty } from '@/api/types';
import NumberInput from '@/components/atoms/NumberInput';
import TextIconButton from '@/components/atoms/TextIconButton';
import TextInput from '@/components/atoms/TextInput';
import { COLORS } from '@/features/prototype/constants';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import {
  AddPartProps,
  DeleteImageProps,
  PartPropertyUpdate,
  PartPropertyWithImage,
} from '@/features/prototype/types';
import { saveImageToIndexedDb } from '@/utils/db';

export default function PartPropertyMenu({
  selectedPartId,
  parts,
  properties,
  onAddPart,
  onDeletePart,
  onDeleteImage,
}: {
  // 選択中のパーツID
  selectedPartId: number | null;
  // パーツ
  parts: Part[];
  // パーツのプロパティ
  properties: PartPropertyWithImage[];
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
  // パーツを削除時の処理
  onDeletePart: () => void;
  // 画像をクリア時の処理
  onDeleteImage: ({
    imageId,
    prototypeId,
    partId,
    side,
    emitUpdate,
  }: DeleteImageProps) => void;
}) {
  const [uploadedImage, setUploadedImage] = useState<{
    id: string;
    displayName: string;
  } | null>(null); // アップロードした画像の情報を管理
  const [isUploading, setIsUploading] = useState(false); // ローディング状態を管理

  const { dispatch } = usePartReducer();
  const { uploadImage } = useImages();
  // 選択中のパーツ、プロパティ
  const { selectedPart, selectedPartProperties } = useMemo(() => {
    return {
      selectedPart: parts.find((part) => part.id === selectedPartId),
      selectedPartProperties: properties.filter(
        (property) => property.partId === selectedPartId
      ),
    };
  }, [parts, properties, selectedPartId]);

  // 現在のプロパティ
  const currentProperty = useMemo(() => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !selectedPartProperties) return;

    // カードパーツの場合はfrontSideを使用、それ以外は'front'をデフォルトとする
    const targetSide = selectedPart.frontSide || 'front';

    return selectedPartProperties.find((p) => p.side === targetSide);
  }, [selectedPart, selectedPartProperties]);

  useEffect(() => {
    // 選択中のプロパティの画像情報を取得
    if (currentProperty?.image) {
      setUploadedImage(() => {
        if (!currentProperty.image) return null;
        return {
          id: currentProperty.image.id,
          displayName: currentProperty.image.displayName,
        };
      });
    } else {
      setUploadedImage(null);
    }
  }, [currentProperty]);
  /**
   * パーツを複製する
   */
  const handleCopyPart = () => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !selectedPartProperties) return;

    // 新しいパーツ
    const newPart: Omit<
      Part,
      'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: selectedPart.type,
      // NOTE： すぐ右側に配置（重ならないように）
      position: {
        x: selectedPart.position.x + selectedPart.width,
        y: selectedPart.position.y,
      },
      width: selectedPart.width,
      height: selectedPart.height,
    };

    // カードパーツの場合
    if (selectedPart.type === 'card') {
      newPart.frontSide = selectedPart.frontSide;
    } else {
      // カード以外のパーツの場合はデフォルトで'front'を設定
      newPart.frontSide = 'front';
    }

    // 手札パーツの場合
    if (selectedPart.type === 'hand') {
      newPart.ownerId = selectedPart.ownerId;
    }

    // 新しいパーツのプロパティ
    const newPartProperties: Omit<
      PartProperty,
      'id' | 'partId' | 'createdAt' | 'updatedAt'
    >[] = selectedPartProperties
      .filter(({ side }) => {
        // カードパーツの場合は両面、それ以外は'front'のみ
        return selectedPart.type === 'card' ? true : side === 'front';
      })
      .map(({ side, name, description, color, imageId, textColor }) => {
        return {
          side,
          name,
          description,
          color,
          textColor,
          imageId,
        };
      });
    onAddPart({ part: newPart, properties: newPartProperties });
  };

  /**
   * プロパティの値が変化している場合のみ更新処理を呼ぶ
   * @param property - 更新するプロパティ
   */
  const handleUpdateProperty = (property: Partial<PartPropertyUpdate>) => {
    // 選択中のパーツが存在しない、またはプロパティが存在しない場合
    if (!selectedPart || !currentProperty) return;

    // 新しいプロパティ
    const updatedProperty = { ...currentProperty, ...property };
    // 現在の値と新しい値が同じ場合
    if (JSON.stringify(currentProperty) === JSON.stringify(updatedProperty))
      return;

    // プロパティの最新化
    dispatch({
      type: 'UPDATE_PART',
      payload: {
        partId: selectedPart.id,
        updateProperties: [updatedProperty],
      },
    });
  };

  // ファイル入力要素を参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイルアップロードボタンがクリックされた時の処理
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click(); // ファイル選択ダイアログを開く
    }
  };

  // ファイルクリアボタンがクリックされた時の処理
  const handleFileClearClick = async () => {
    if (
      !uploadedImage?.id ||
      !currentProperty?.side ||
      !selectedPart?.id ||
      !currentProperty?.imageId
    )
      return;

    onDeleteImage({
      imageId: uploadedImage.id,
      prototypeId: selectedPart.prototypeId,
      partId: selectedPart.id,
      side: currentProperty.side,
      emitUpdate: 'true', // 更新をemitする
    });
  };

  /**
   * 画像をアップロードする
   * - ファイル選択ダイアログで選択された画像を取得し、アップロードする
   * - アップロードが成功した場合、IndexedDBに画像を保存し、プロパティを更新する
   * @param event - イベント
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const image = event.target?.files ? event.target.files[0] : null;
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    setIsUploading(true); // ローディング開始
    try {
      const response = await uploadImage(formData);
      if (response.id) {
        // IndexedDBに画像を保存
        await saveImageToIndexedDb(response.id, image);
        // アップロードした画像の情報を状態に保存(今後の拡張を考慮して、オブジェクトで管理)
        setUploadedImage({
          id: response.id,
          displayName: response.displayName,
        });
        // プロパティを更新
        handleUpdateProperty({ imageId: response.id });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Axiosエラーの場合の処理
        console.error('Axios Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        // その他のエラーの場合の処理
        console.error('Unexpected Error:', error);
      }
    } finally {
      setIsUploading(false); // ローディング終了
    }
  };

  return (
    <>
      {selectedPart && (
        <div className="fixed top-20 right-4 flex w-[240px] flex-col rounded-lg shadow-lg bg-gradient-to-b from-kibako-secondary to-kibako-secondary/80 max-h-[80vh]">
          {/* 固定ヘッダー */}
          <div className="rounded-t-lg bg-gradient-to-r from-kibako-primary/70 to-kibako-primary/50 py-2 px-4 flex-shrink-0">
            <div className="flex items-center">
              {selectedPart.type === 'card' ? (
                <GiCard10Clubs className="h-4 w-4 text-kibako-white mr-2" />
              ) : selectedPart.type === 'token' ? (
                <Gi3dMeeple className="h-4 w-4 text-kibako-white mr-2" />
              ) : selectedPart.type === 'hand' ? (
                <GiPokerHand className="h-4 w-4 text-kibako-white mr-2" />
              ) : selectedPart.type === 'deck' ? (
                <GiStoneBlock className="h-4 w-4 text-kibako-white mr-2" />
              ) : selectedPart.type === 'area' ? (
                <BiArea className="h-4 w-4 text-kibako-white mr-2" />
              ) : null}
              <span className="text-[12px] font-medium text-kibako-white">
                プロパティ編集
              </span>
            </div>
          </div>
          {/* スクロール可能なコンテンツエリア */}
          <div className="flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-around px-2 pb-2">
              <TextIconButton
                text="複製"
                icon={<FaRegCopy className="h-3 w-3" />}
                isSelected={false}
                onClick={() => {
                  handleCopyPart();
                }}
              />
              <TextIconButton
                text="削除"
                icon={<FaRegTrashAlt className="h-3 w-3" />}
                isSelected={false}
                onClick={() => {
                  onDeletePart();
                }}
              />
            </div>
            {selectedPart.type === 'card' && (
              <div className="flex items-center justify-center mb-2">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    selectedPart.frontSide === 'front'
                      ? 'text-green-800 bg-green-200'
                      : 'text-red-800 bg-red-200'
                  }`}
                >
                  {selectedPart.frontSide === 'front'
                    ? '表面の設定'
                    : '裏面の設定'}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-medium text-kibako-white">位置</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  key={`${selectedPart.id}-x-${selectedPart.position.x}`}
                  value={selectedPart.position.x}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: {
                          position: { x: number, y: selectedPart.position.y },
                        },
                      },
                    });
                  }}
                  icon={<>X</>}
                />
                <NumberInput
                  key={`${selectedPart.id}-y-${selectedPart.position.y}`}
                  value={selectedPart.position.y}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: {
                          position: { x: selectedPart.position.x, y: number },
                        },
                      },
                    });
                  }}
                  icon={<>Y</>}
                />
              </div>
              <p className="text-[9px] font-medium text-kibako-white">サイズ</p>
              <div className="flex w-full gap-2 mb-2">
                <NumberInput
                  key={`${selectedPart.id}-width-${selectedPart.width}`}
                  value={selectedPart.width}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { width: number },
                      },
                    });
                  }}
                  icon={<>W</>}
                />
                <NumberInput
                  key={`${selectedPart.id}-height-${selectedPart.height}`}
                  value={selectedPart.height}
                  onChange={(number) => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedPart.id,
                        updatePart: { height: number },
                      },
                    });
                  }}
                  icon={<>H</>}
                />
              </div>
              <p className="text-[9px] font-medium text-kibako-white">名前</p>
              <div className="flex w-full mb-2">
                <TextInput
                  key={`${selectedPart.id}-name-${currentProperty?.name}`}
                  value={currentProperty?.name ?? ''}
                  onChange={(name) => handleUpdateProperty({ name })}
                  icon={<>T</>}
                />
              </div>
              <p className="text-[9px] font-medium text-kibako-white">説明</p>
              <div className="flex w-full mb-2">
                <TextInput
                  key={`${selectedPart.id}-description-${currentProperty?.description}`}
                  value={currentProperty?.description ?? ''}
                  onChange={(description) =>
                    handleUpdateProperty({ description })
                  }
                  icon={<>T</>}
                  multiline
                  resizable
                />
              </div>
              <p className="text-[9px] font-medium text-kibako-white">
                テキスト色
              </p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.TEXT.map((textColor) => (
                    <button
                      key={textColor}
                      onClick={() => handleUpdateProperty({ textColor })}
                      className={`w-5 h-5 rounded-full border-2 ${
                        currentProperty?.textColor === textColor
                          ? 'border-blue-500'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: textColor }}
                      title={textColor}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[9px] font-medium text-kibako-white">背景色</p>
              <div className="w-full mb-2 px-4">
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.BACKGROUNDS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdateProperty({ color })}
                      className={`w-5 h-5 rounded-full border-2 ${
                        currentProperty?.color === color
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
                    value={currentProperty?.color || '#FFFFFF'}
                    onChange={(e) =>
                      handleUpdateProperty({ color: e.target.value })
                    }
                    className="w-5 h-5"
                  />
                  <span className="Text-sm text-kibako-white">
                    カスタムカラーを選択
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-medium text-kibako-white">画像</p>
                <div className="flex items-center w-full px-2 mb-2 gap-2">
                  {uploadedImage ? (
                    <>
                      {/* アップロードした画像のdisplayNameを表示 */}
                      <span
                        className="text-xs text-kibako-white truncate w-1/2"
                        title={uploadedImage.displayName}
                      >
                        {uploadedImage.displayName}
                      </span>
                      {/* 画像クリアボタン */}
                      <button
                        onClick={handleFileClearClick}
                        className="flex items-center justify-center w-6 h-6 text-red-600 bg-red-100 border border-red-300 rounded hover:bg-red-200"
                        title="画像をクリア"
                      >
                        <FaRegTrashAlt className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* 画像アップロード */}
                      <TextIconButton
                        text="アップロード"
                        icon={
                          isUploading ? (
                            <FaSpinner className="h-3 w-3 animate-spin" />
                          ) : (
                            <FaImage className="h-3 w-3" />
                          )
                        }
                        isSelected={false}
                        onClick={handleFileUploadClick}
                        disabled={isUploading}
                      />
                    </>
                  )}
                  {/* 非表示のファイル入力要素。画像アップロードボタンのクリックでこの要素がクリックされ、ファイル選択ダイアログが開く */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
