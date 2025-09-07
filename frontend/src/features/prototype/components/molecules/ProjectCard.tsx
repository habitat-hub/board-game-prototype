import React, { useContext, useState } from 'react';

import { Prototype, Project } from '@/api/types';
import { UserContext } from '@/contexts/UserContext';
import PrototypeNameEditor from '@/features/prototype/components/atoms/PrototypeNameEditor';
import { getProjectIcon } from '@/features/prototype/utils/getProjectIcon';
import formatDate from '@/utils/dateFormat';

/**
 * ProjectCardのProps
 */
type ProjectCardProps = {
  // プロジェクト情報
  project: Project;
  // マスタープロトタイプ情報
  masterPrototype: Prototype;
  // 編集関連
  isNameEditing: boolean;
  editedName: string;
  setEditedName: (value: string) => void;
  // イベントハンドラー
  onCardClick: () => void;
  onContextMenu: (
    e: React.MouseEvent,
    project: Project,
    masterPrototype: Prototype
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBlur: () => Promise<void>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
};

/**
 * プロジェクトカードコンポーネント
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  masterPrototype,
  onCardClick,
  onContextMenu,
}) => {
  // UserContextからユーザー情報を取得
  const userContext = useContext(UserContext);

  const { id, name, createdAt } = masterPrototype;
  const IconComponent = getProjectIcon(id);
  const [updatedName, setUpdatedName] = useState<string | null>(null);

  return (
    <div
      className="bg-kibako-white border border-kibako-secondary/30 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, project, masterPrototype);
      }}
      title="クリックで編集 / 右クリックでメニュー表示"
    >
      {/* カード画像エリア */}
      <div className="relative h-40 bg-gradient-to-br from-kibako-accent to-kibako-tertiary flex items-center justify-center">
        <IconComponent className="w-24 h-24 text-kibako-white" />
        <div className="absolute inset-0 bg-black/10 rounded-t-xl"></div>
      </div>

      {/* カード内容 */}
      <div className="p-3">
        {/* プロトタイプ名（インライン編集） */}
        <div className="flex items-center">
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <PrototypeNameEditor
              prototypeId={id}
              name={updatedName ?? name}
              size="base"
              weight="bold"
              truncate={false}
              bleedX={false}
              onUpdated={(newName) => setUpdatedName(newName)}
            />
          </div>
        </div>
        {/* 詳細情報 */}
        <div className="flex justify-end mt-2">
          <div className="text-right text-xs text-kibako-secondary">
            <div>
              作成者:{' '}
              {userContext?.user?.id === project.userId
                ? '自分'
                : '他のユーザー'}
            </div>
            <div>作成日時: {formatDate(createdAt, true)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
