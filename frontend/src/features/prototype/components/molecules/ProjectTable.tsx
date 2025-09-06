import Link from 'next/link';
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
import formatDate from '@/utils/dateFormat';

export type ProjectTableSortKey = 'name' | 'createdAt';

type ProjectTableProps = {
  prototypeList: { project: Project; masterPrototype: Prototype }[];
  sortKey: ProjectTableSortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: ProjectTableSortKey) => void;
  onRowClick: (projectId: string, prototypeId: string) => void;
};

export const ProjectTable: React.FC<ProjectTableProps> = ({
  prototypeList,
  sortKey,
  sortOrder,
  onSort,
  onRowClick,
}) => {
  // 即時反映用: 名前更新が完了した行の一時表示名
  const [updatedNames, setUpdatedNames] = useState<Record<string, string>>({});
  const userContext = useContext(UserContext);

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
    <div className="mb-8 overflow-hidden rounded-xl border border-kibako-secondary/30 bg-kibako-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse text-left text-sm">
          <thead className="sticky top-0 z-sticky bg-kibako-primary text-kibako-white">
            <tr>
              <th className="px-4 py-3 w-[50%]">
                <button
                  type="button"
                  onClick={() => onSort('name')}
                  className="group inline-flex select-none items-center gap-2 font-semibold text-kibako-white hover:text-kibako-tertiary focus:outline-none focus:ring-2 focus:ring-kibako-accent/60 focus:ring-offset-2 focus:ring-offset-kibako-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <FaFolderOpen className="text-base opacity-90" />
                    <span>プロジェクト名</span>
                  </span>
                  {renderSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3 w-[120px]">作成者</th>
              <th className="px-4 py-3 w-[200px]">
                <button
                  type="button"
                  onClick={() => onSort('createdAt')}
                  className="group inline-flex select-none items-center gap-2 font-semibold text-kibako-white hover:text-kibako-tertiary focus:outline-none focus:ring-2 focus:ring-kibako-accent/60 focus:ring-offset-2 focus:ring-offset-kibako-primary"
                >
                  <span>作成日時</span>
                  {renderSortIcon('createdAt')}
                </button>
              </th>
              <th className="px-4 py-3 text-right w-[120px]">操作</th>
            </tr>
          </thead>
          <tbody>
            {prototypeList.map(({ project, masterPrototype }) => (
              <tr
                key={project.id}
                className="odd:bg-kibako-white even:bg-kibako-tertiary/40 border-b border-kibako-secondary/20 text-kibako-primary transition-colors hover:bg-kibako-accent/5"
              >
                <td className="px-4 py-3 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-kibako-accent/70 ring-2 ring-kibako-accent/30" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium min-w-0">
                        <PrototypeNameEditor
                          prototypeId={masterPrototype.id}
                          name={
                            updatedNames[masterPrototype.id] ??
                            masterPrototype.name
                          }
                          onUpdated={(newName) =>
                            setUpdatedNames((prev) => ({
                              ...prev,
                              [masterPrototype.id]: newName,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="text-xs text-kibako-primary">
                    {userContext?.user?.id === project.userId
                      ? '自分'
                      : '他のユーザー'}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <span className="rounded-md bg-kibako-tertiary/60 px-2 py-1 text-xs text-kibako-primary ring-1 ring-inset ring-kibako-secondary/30 whitespace-nowrap">
                    {formatDate(masterPrototype.createdAt, true)}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      aria-label="開く"
                      title="開く"
                      onClick={() => onRowClick(project.id, masterPrototype.id)}
                      className="inline-flex items-center justify-center rounded-md border border-kibako-secondary/30 bg-white px-2 py-1 text-kibako-primary shadow-sm hover:bg-kibako-tertiary/60 hover:text-kibako-primary focus:outline-none"
                    >
                      <FaFolderOpen className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/projects/${project.id}/roles`}
                      aria-label="権限設定"
                      title="権限設定"
                      className="inline-flex items-center justify-center rounded-md border border-kibako-secondary/30 bg-white px-2 py-1 text-kibako-primary shadow-sm hover:bg-kibako-tertiary/60 hover:text-kibako-primary focus:outline-none"
                    >
                      <FaUsers className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/projects/${project.id}/delete`}
                      aria-label="削除"
                      title="削除"
                      className="inline-flex items-center justify-center rounded-md border border-kibako-secondary/30 bg-white px-2 py-1 text-kibako-primary shadow-sm hover:bg-red-50 hover:text-red-600 focus:outline-none"
                    >
                      <FaTrash className="h-4 w-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;
