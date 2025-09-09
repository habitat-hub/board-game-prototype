import React from 'react';

import { Prototype, Project } from '@/api/types';
import { ProjectCard } from '@/features/prototype/components/molecules/ProjectCard';

type ProjectCardListProps = {
  prototypeList: {
    project: Project;
    masterPrototype: Prototype;
    partCount: number;
    roomCount: number;
  }[];
  projectAdminMap: Record<string, boolean>;
  // 編集状態と値
  isNameEditing: (prototypeId: string) => boolean;
  editedName: string;
  setEditedName: (value: string) => void;
  // イベントハンドラー
  onCardClick: (projectId: string, prototypeId: string) => void;
  onContextMenu: (
    e: React.MouseEvent,
    project: Project,
    masterPrototype: Prototype
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBlur: () => Promise<void>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => Promise<void>;
};

export const ProjectCardList: React.FC<ProjectCardListProps> = ({
  prototypeList,
  projectAdminMap,
  isNameEditing,
  editedName,
  setEditedName,
  onCardClick,
  onContextMenu,
  onSubmit,
  onBlur,
  onKeyDown,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
      {prototypeList.map(({ masterPrototype, project, partCount, roomCount }) => {
        if (!masterPrototype) return null;
        const { id } = masterPrototype;
        const nameEditing = isNameEditing(id);
        const isProjectAdmin = projectAdminMap[project.id];

        const handleCardClick = () => onCardClick(project.id, id);

        return (
          <ProjectCard
            key={id}
            project={project}
            masterPrototype={masterPrototype}
            partCount={partCount}
            roomCount={roomCount}
            isProjectAdmin={isProjectAdmin}
            isNameEditing={nameEditing}
            editedName={editedName}
            setEditedName={setEditedName}
            onCardClick={handleCardClick}
            onContextMenu={onContextMenu}
            onSubmit={onSubmit}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          />
        );
      })}
    </div>
  );
};

export default ProjectCardList;
