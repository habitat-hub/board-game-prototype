import React, { useContext, useState } from 'react';
import {
  FaFolderOpen,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

import { Prototype, Project } from '@/api/types';
import { UserContext } from '@/contexts/UserContext';
import PrototypeNameEditor from '@/features/prototype/components/atoms/PrototypeNameEditor';
import RowCell from '@/features/prototype/components/atoms/RowCell';
import RowIconButton from '@/features/prototype/components/atoms/RowIconButton';
import RowIconLink from '@/features/prototype/components/atoms/RowIconLink';
import { getProjectIcon } from '@/features/prototype/utils/getProjectIcon';
import formatDate from '@/utils/dateFormat';

export type ProjectTableSortKey = 'name' | 'createdAt';

type ProjectTableProps = {
  prototypeList: { project: Project; masterPrototype: Prototype }[];
  sortKey: ProjectTableSortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: ProjectTableSortKey) => void;
  onSelectPrototype: (projectId: string, prototypeId: string) => void;
};

export const ProjectTable: React.FC<ProjectTableProps> = ({
  prototypeList,
  sortKey,
  sortOrder,
  onSort,
  onSelectPrototype,
}) => {
  // 即時反映用: 名前更新が完了した行の一時表示名
  const [updatedNames, setUpdatedNames] = useState<Record<string, string>>({});
  const userContext = useContext(UserContext);

  // プロジェクト行で使用するアイコン（IDベースで安定）
  const renderIcon = (id: string) => {
    const Icon = getProjectIcon(id);
    return <Icon className="h-5 w-5 text-kibako-secondary" />;
  };

  const renderSortIcon = (key: ProjectTableSortKey) => {
    const base = 'inline align-middle text-sm';
    if (sortKey !== key)
      return <FaSort className={base + ' text-kibako-secondary'} />;
    return sortOrder === 'asc' ? (
      <FaSortUp className={base + ' text-kibako-accent'} />
    ) : (
      <FaSortDown className={base + ' text-kibako-accent'} />
    );
  };

  return (
    <table className="w-full table-auto text-left text-sm rounded-xl border border-kibako-secondary/30 overflow-hidden shadow-sm bg-kibako-white">
      <thead className="bg-kibako-primary text-kibako-white">
        <tr className="grid project-table-grid items-center">
          <th className="px-4 py-2">
            <button
              type="button"
              onClick={() => onSort('name')}
              className="inline-flex items-center gap-2 font-semibold"
            >
              <span className="inline-flex items-center gap-2">
                <FaFolderOpen className="text-base" />
                <span>プロジェクト名</span>
              </span>
              {renderSortIcon('name')}
            </button>
          </th>
          <th className="px-4 py-2">作成者</th>
          <th className="px-4 py-2">
            <button
              type="button"
              onClick={() => onSort('createdAt')}
              className="inline-flex items-center gap-2 font-semibold"
            >
              <span>作成日時</span>
              {renderSortIcon('createdAt')}
            </button>
          </th>
          <th className="px-4 py-2 text-right">操作</th>
        </tr>
      </thead>
      <tbody className="block max-h-[60vh] overflow-y-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {prototypeList.map(({ project, masterPrototype }) => (
          <tr
            key={project.id}
            className="grid project-table-grid items-center border-b text-kibako-primary"
          >
            <RowCell className="overflow-hidden">
              <div className="flex items-center gap-3 min-w-0 w-full overflow-hidden">
                <button
                  type="button"
                  aria-label="開く"
                  title="開く"
                  onClick={() => onSelectPrototype(project.id, masterPrototype.id)}
                  className="p-1 rounded hover:bg-kibako-accent/20 focus:outline-none focus:ring-2 focus:ring-kibako-accent/50"
                >
                  {renderIcon(masterPrototype.id)}
                </button>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <PrototypeNameEditor
                    prototypeId={masterPrototype.id}
                    name={
                      updatedNames[masterPrototype.id] ?? masterPrototype.name
                    }
                    bleedX={false}
                    onUpdated={(newName) =>
                      setUpdatedNames((prev) => ({
                        ...prev,
                        [masterPrototype.id]: newName,
                      }))
                    }
                  />
                </div>
              </div>
            </RowCell>
            <RowCell>
              <span className="text-xs text-kibako-secondary">
                {userContext?.user?.id === project.userId
                  ? '自分'
                  : '他のユーザー'}
              </span>
            </RowCell>
            <RowCell>
              <span className="whitespace-nowrap text-xs text-kibako-secondary">
                {formatDate(masterPrototype.createdAt, true)}
              </span>
            </RowCell>
            <td className="px-4 py-2 align-middle">
              <div className="flex items-center justify-end gap-2 h-full">
                <RowIconButton
                  ariaLabel="開く"
                  title="開く"
                  onClick={() => onSelectPrototype(project.id, masterPrototype.id)}
                >
                  <FaFolderOpen className="h-4 w-4" />
                </RowIconButton>
                <RowIconLink
                  href={`/projects/${project.id}/roles`}
                  ariaLabel="権限設定"
                  title="権限設定"
                >
                  <FaUsers className="h-4 w-4" />
                </RowIconLink>
                <RowIconLink
                  href={`/projects/${project.id}/delete`}
                  ariaLabel="削除"
                  title="削除"
                  variant="danger"
                >
                  <FaTrash className="h-4 w-4" />
                </RowIconLink>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProjectTable;
