import React, { useContext } from 'react';
import { GiWoodenCrate, GiCardAceSpades, GiPuzzle } from 'react-icons/gi';

import { Prototype, Project } from '@/api/types';
import { UserContext } from '@/contexts/UserContext';
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
  onContextMenu: (e: React.MouseEvent, project: Project, masterPrototype: Prototype) => void;
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
  isNameEditing,
  editedName,
  setEditedName,
  onCardClick,
  onContextMenu,
  onSubmit,
  onBlur,
  onKeyDown,
}) => {
  // UserContextからユーザー情報を取得
  const userContext = useContext(UserContext);

  const { id, name, createdAt } = masterPrototype;

  /**
   * ランダムなアイコンを取得する
   * @param id プロトタイプID（一意性を保つため）
   * @returns アイコンコンポーネント
   */
  const getRandomIcon = (id: string) => {
    const icons = [GiWoodenCrate, GiCardAceSpades, GiPuzzle];
    // IDをもとにハッシュ値を生成して一意性を保つ
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const iconIndex = hash % icons.length;
    const IconComponent = icons[iconIndex];
    
    return <IconComponent className="w-20 h-20 text-white/80" />;
  };

  return (
    <div
      className="bg-content border border-wood-lightest/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onCardClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, project, masterPrototype);
      }}
      title="クリックで編集 / 右クリックでメニュー表示"
    >
      {/* カード画像エリア */}
      <div className="relative h-48 bg-gradient-to-br from-kibako-primary to-kibako-primary/85 flex items-center justify-center">
        {getRandomIcon(id)}
        <div className="absolute inset-0 bg-black/10 rounded-t-xl"></div>
      </div>

      {/* カード内容 */}
      <div className="p-4 space-y-4">
        {/* プロトタイプ名 */}
        <div className="min-h-[25px] flex items-center">
          {isNameEditing ? (
            <form
              className="w-full"
              onSubmit={onSubmit}
            >
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() =>
                  onBlur().catch((error) => {
                    console.error('Error in onBlur:', error);
                    alert(error.message || 'エラーが発生しました');
                  })
                }
                onKeyDown={(e) =>
                  onKeyDown(e).catch((error) => {
                    console.error('Error in onKeyDown:', error);
                    alert(error.message || 'エラーが発生しました');
                  })
                }
                className="w-full text-wood-darkest font-semibold bg-transparent border border-transparent rounded-md p-2 -m-2 focus:outline-none focus:bg-white focus:border-header focus:shadow-sm transition-all text-lg"
                autoFocus
              />
            </form>
          ) : (
            <span className="text-wood-darkest font-semibold p-2 -m-2 rounded-md text-left text-lg leading-tight">
              {name}
            </span>
          )}
        </div>
        {/* 詳細情報 */}
        <div className="space-y-2">
          <div className="flex justify-end">
            <div className="text-right text-xs text-wood-light space-y-1">
              <div>
                作成者: {userContext?.user?.id === project.userId
                  ? '自分'
                  : '他のユーザー'}
              </div>
              <div>作成日時: {formatDate(createdAt, true)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 