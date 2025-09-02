/**
 * @page パーツ編集ページに表示するパーツのプロパティを編集するメニュー
 */

'use client';

import axios from 'axios';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaRegCopy, FaRegTrashAlt, FaImage, FaSpinner } from 'react-icons/fa';
import { IoMdMove } from 'react-icons/io';

import { useImages } from '@/api/hooks/useImages';
import { Part } from '@/api/types';
import NumberInput from '@/components/atoms/NumberInput';
import TextInput from '@/components/atoms/TextInput';
import ColorPicker from '@/features/prototype/components/atoms/ColorPicker';
import PartPropertyMenuButton from '@/features/prototype/components/atoms/PartPropertyMenuButton';
import PartTypeIcon from '@/features/prototype/components/atoms/PartTypeIcon';
import { COLORS } from '@/features/prototype/constants';
import useDraggablePartPropertyMenu from '@/features/prototype/hooks/useDraggablePartPropertyMenu';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import {
  DeleteImageProps,
  PartPropertyUpdate,
  PartPropertyWithImage,
} from '@/features/prototype/types';
import { saveImageToIndexedDb } from '@/utils/db';

// フロントエンドで許可する画像のMIMEタイプ
const IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

// Props type for PartPropertyMenu
export type PartPropertyMenuProps = {
  // 選択中のパーツID
  selectedPartIds: number[];
  // パーツ
  parts: Part[];
  // パーツのプロパティ
  properties: PartPropertyWithImage[];
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
  // パーツ複製時の処理
  onDuplicatePart: () => void;
};

export default function PartPropertyMenu({
  selectedPartIds,
  parts,
  properties,
  onDeletePart,
  onDeleteImage,
  onDuplicatePart,
}: PartPropertyMenuProps) {
  const selectedPartId = selectedPartIds[0];
  const showMenu = selectedPartIds.length === 1;

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

  const {
    containerRef,
    position,
    isDragging,
    handleDragStart,
    clampToViewport,
  } = useDraggablePartPropertyMenu();

  // メニューが表示されるとき、または選択中パーツが変更されたときにクランプする
  const prevSelectedPartIdRef = useRef<number | undefined>(undefined);
  const prevShowMenuRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // showMenu が false の場合は履歴だけ更新して終了
    if (!showMenu) {
      prevSelectedPartIdRef.current = selectedPartId;
      prevShowMenuRef.current = showMenu;
      return;
    }

    const becameVisible = prevShowMenuRef.current !== true;
    const selectedChanged =
      prevSelectedPartIdRef.current !== undefined &&
      prevSelectedPartIdRef.current !== selectedPartId;

    if (becameVisible || selectedChanged) {
      clampToViewport();
    }

    prevSelectedPartIdRef.current = selectedPartId;
    prevShowMenuRef.current = showMenu;
  }, [selectedPartId, showMenu, clampToViewport]);

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

    // 許可されていないMIMEタイプの場合：アップロードを中止して通知し、
    // 同じファイルを再選択できるように入力をクリアする
    if (!IMAGE_ALLOWED_MIME_TYPES.includes(image.type)) {
      window.alert('サポートされていない画像形式です（JPEG, PNGのみ対応）');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    setIsUploading(true); // ローディング開始
    try {
      const response = await uploadImage.mutateAsync(formData);
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
        <div
          ref={containerRef}
          className={`flex w-[240px] flex-col rounded-lg shadow-lg bg-kibako-secondary/70 max-h-[80vh] text-xs ${
            isDragging ? 'opacity-95' : ''
          } ${showMenu ? '' : 'hidden'}`}
          style={{
            position: 'fixed',
            left: position ? `${position.x}px` : undefined,
            top: position ? `${position.y}px` : undefined,
            // keep zIndex high so it stays above canvas
            zIndex: 50,
          }}
        >
          {/* 固定ヘッダー */}
          <div
            className="relative rounded-t-lg bg-kibako-primary/70 text-kibako-white py-2 px-4 flex-shrink-0 cursor-move pr-8"
            // mouse
            onMouseDown={handleDragStart}
            // touch
            onTouchStart={handleDragStart}
          >
            <div className="flex items-center select-none">
              <PartTypeIcon type={selectedPart.type} className="h-4 w-4 mr-2" />
              <span className="text-[12px] font-medium">プロパティ編集</span>
            </div>
            {/* fixed move icon at top-right of the header */}
            <IoMdMove
              className="h-4 w-4 absolute right-2 top-2 opacity-80"
              aria-hidden="true"
            />
          </div>
          {/* スクロール可能なコンテンツエリア */}
          <div className="flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center justify-around px-2 pb-2">
              <PartPropertyMenuButton
                text="複製"
                icon={<FaRegCopy className="h-3 w-3" />}
                onClick={() => onDuplicatePart()}
              />
              <PartPropertyMenuButton
                text="削除"
                icon={<FaRegTrashAlt className="h-3 w-3" />}
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
              <p className="text-kibako-white">位置</p>
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
              <p className="text-kibako-white">サイズ</p>
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
              <p className="text-kibako-white">名前</p>
              <div className="flex w-full mb-2">
                <TextInput
                  key={`${selectedPart.id}-name-${currentProperty?.name}`}
                  value={currentProperty?.name ?? ''}
                  onChange={(name) => handleUpdateProperty({ name })}
                  icon={<>T</>}
                />
              </div>
              <p className="text-kibako-white">説明</p>
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
              <p className="text-kibako-white">テキスト色</p>
              <div className="w-full mb-2 px-2">
                <div className="grid grid-cols-5 gap-1 mb-1">
                  {COLORS.TEXT.map((textColor) => (
                    <button
                      key={textColor}
                      onClick={() => handleUpdateProperty({ textColor })}
                      className={`w-5 h-5 rounded-full ${
                        currentProperty?.textColor === textColor &&
                        'border-2 border-kibako-accent'
                      }`}
                      style={{ backgroundColor: textColor }}
                      title={textColor}
                    />
                  ))}
                </div>
                <ColorPicker
                  value={currentProperty?.textColor || '#000000'}
                  palette={COLORS.TEXT}
                  onChange={(textColor) => handleUpdateProperty({ textColor })}
                />
              </div>
              <p className="text-kibako-white">背景色</p>
              <div className="w-full mb-2 px-2">
                <div className="grid grid-cols-5 gap-1 mb-1">
                  {COLORS.BACKGROUNDS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdateProperty({ color })}
                      className={`w-5 h-5 rounded-full ${
                        currentProperty?.color === color &&
                        ' border-2 border-kibako-accent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <ColorPicker
                  value={currentProperty?.color || '#FFFFFF'}
                  palette={COLORS.BACKGROUNDS}
                  onChange={(color) => handleUpdateProperty({ color })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-kibako-white">画像</p>
                <div className="flex items-center w-full px-2 mb-2 gap-2">
                  {uploadedImage ? (
                    <>
                      {/* アップロードした画像のdisplayNameを表示 */}
                      <span
                        className="text-xs truncate w-1/2"
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
                      <PartPropertyMenuButton
                        text="アップロード"
                        icon={
                          isUploading ? (
                            <FaSpinner className="h-3 w-3 animate-spin" />
                          ) : (
                            <FaImage className="h-3 w-3" />
                          )
                        }
                        onClick={handleFileUploadClick}
                        disabled={isUploading}
                      />
                    </>
                  )}
                  {/* 非表示のファイル入力要素。画像アップロードボタンのクリックでこの要素がクリックされ、ファイル選択ダイアログが開く */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={IMAGE_ALLOWED_MIME_TYPES.join(',')}
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
