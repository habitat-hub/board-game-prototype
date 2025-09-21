/** File updated by Codex CLI **/
import axios from 'axios';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { FaRegCopy, FaRegTrashAlt, FaImage, FaSpinner } from 'react-icons/fa';
import { LuArrowLeftRight } from 'react-icons/lu';

import { Part } from '@/__generated__/api/client';
import { useImages } from '@/api/hooks/useImages';
import NumberInput from '@/components/atoms/NumberInput';
import TextInput from '@/components/atoms/TextInput';
import ColorPicker from '@/features/prototype/components/atoms/ColorPicker';
import PartPropertyMenuButton from '@/features/prototype/components/atoms/PartPropertyMenuButton';
import { COLORS, KEYBOARD_SHORTCUTS } from '@/features/prototype/constants';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import {
  DeleteImageProps,
  PartPropertyUpdate,
  PartPropertyWithImage,
} from '@/features/prototype/types';
import { saveImageToIndexedDb } from '@/utils/db';

const IMAGE_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

interface PartPropertyMenuSingleProps {
  selectedPart: Part | null;
  properties: PartPropertyWithImage[];
  onDeletePart: () => void;
  onDeleteImage: ({
    imageId,
    prototypeId,
    partId,
    side,
    emitUpdate,
  }: DeleteImageProps) => void;
  onDuplicatePart: () => void;
  isPlayMode: boolean;
  hidden: boolean;
}

export default function PartPropertyMenuSingle({
  selectedPart,
  properties,
  onDeletePart,
  onDeleteImage,
  onDuplicatePart,
  isPlayMode,
  hidden,
}: PartPropertyMenuSingleProps) {
  const { dispatch } = usePartReducer();
  const { uploadImage } = useImages();

  const selectedPartProperties = useMemo(
    () =>
      selectedPart
        ? properties.filter((p) => p.partId === selectedPart.id)
        : [],
    [properties, selectedPart]
  );

  const currentProperty = useMemo(() => {
    if (!selectedPart) return;
    const targetSide = selectedPart.frontSide || 'front';
    return selectedPartProperties.find((p) => p.side === targetSide);
  }, [selectedPart, selectedPartProperties]);

  const [uploadedImage, setUploadedImage] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentProperty?.image) {
      setUploadedImage({
        id: currentProperty.image.id,
        displayName: currentProperty.image.displayName,
      });
    } else {
      setUploadedImage(null);
    }
  }, [currentProperty]);

  /** プロパティを部分更新する（差分のみ送信） */
  const handleUpdateProperty = (
    property: Partial<PartPropertyUpdate>
  ): void => {
    if (!selectedPart || !currentProperty) return;
    const updatedProperty: PartPropertyWithImage = {
      ...currentProperty,
      ...property,
    } as PartPropertyWithImage;
    if (JSON.stringify(currentProperty) === JSON.stringify(updatedProperty))
      return;
    // API は imageId のみ受け付けるため image は除外（イミュータブルに除外）
    const { image: imageToDrop, ...updateProperty } =
      updatedProperty as PartPropertyUpdate & { image?: unknown };
    void imageToDrop;
    dispatch({
      type: 'UPDATE_PART',
      payload: { partId: selectedPart.id, updateProperties: [updateProperty] },
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

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
      emitUpdate: 'true',
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const image = event.target?.files ? event.target.files[0] : null;
    if (!image) return;

    if (!IMAGE_ALLOWED_MIME_TYPES.includes(image.type)) {
      window.alert('サポートされていない画像形式です（JPEG, PNGのみ対応）');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', image);

    setIsUploading(true);
    try {
      const response = await uploadImage(formData);
      if (response.id) {
        await saveImageToIndexedDb(response.id, image);
        setUploadedImage({
          id: response.id,
          displayName: response.displayName,
        });
        handleUpdateProperty({ imageId: response.id });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error('Unexpected Error:', error);
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!selectedPart) {
    return <div style={{ display: hidden ? 'none' : 'block' }} />;
  }

  return (
    <div
      className="flex flex-col gap-2"
      style={{ display: hidden ? 'none' : 'flex' }}
    >
      {!isPlayMode && (
        <div className="flex items-center justify-around px-2 pb-2">
          <PartPropertyMenuButton
            text="複製"
            icon={<FaRegCopy className="h-3 w-3" />}
            onClick={onDuplicatePart}
            title={KEYBOARD_SHORTCUTS.duplicatePart.label}
          />
          <PartPropertyMenuButton
            text="削除"
            icon={<FaRegTrashAlt className="h-3 w-3" />}
            onClick={() => {
              onDeletePart();
            }}
            title={KEYBOARD_SHORTCUTS.deleteParts.label}
          />
        </div>
      )}
      {!isPlayMode && selectedPart.type === 'card' && (
        <div className="flex items-center justify-center mb-2 gap-2">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              (selectedPart.frontSide ?? 'front') === 'front'
                ? 'text-green-800 bg-green-200'
                : 'text-red-800 bg-red-200'
            }`}
          >
            {(selectedPart.frontSide ?? 'front') === 'front' ? '表面' : '裏面'}
          </span>
          <PartPropertyMenuButton
            text=""
            ariaLabel="表裏を切り替え"
            title="表裏を切り替え"
            icon={<LuArrowLeftRight className="h-3 w-3" />}
            onClick={() =>
              dispatch({
                type: 'UPDATE_PART',
                payload: {
                  partId: selectedPart.id,
                  updatePart: {
                    frontSide:
                      (selectedPart.frontSide ?? 'front') === 'front'
                        ? 'back'
                        : 'front',
                  },
                },
              })
            }
          />
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
        {!isPlayMode && (
          <>
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
                    className={`w-5 h-5 rounded-full ${currentProperty?.textColor === textColor && 'border-2 border-kibako-accent'}`}
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
                    className={`w-5 h-5 rounded-full ${currentProperty?.color === color && ' border-2 border-kibako-accent'}`}
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
                    <span
                      className="text-xs truncate w-1/2"
                      title={uploadedImage.displayName}
                    >
                      {uploadedImage.displayName}
                    </span>
                    <button
                      onClick={handleFileClearClick}
                      className="flex items-center justify-center w-6 h-6 text-red-600 bg-red-100 border border-red-300 rounded hover:bg-red-200"
                      title="画像をクリア"
                    >
                      <FaRegTrashAlt className="h-3 w-3" />
                    </button>
                  </>
                ) : (
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
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ALLOWED_MIME_TYPES.join(',')}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
