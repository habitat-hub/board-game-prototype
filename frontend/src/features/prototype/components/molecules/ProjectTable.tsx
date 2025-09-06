import React from 'react';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';

import { Prototype, Project } from '@/api/types';
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
  const renderSortIcon = (key: ProjectTableSortKey) => {
    if (sortKey !== key) return <FaSort className="inline" />;
    return sortOrder === 'asc' ? (
      <FaSortUp className="inline" />
    ) : (
      <FaSortDown className="inline" />
    );
  };

  return (
    <table className="w-full table-auto border-collapse mb-8">
      <thead>
        <tr className="bg-kibako-tertiary/10 text-left">
          <th className="p-2 cursor-pointer" onClick={() => onSort('name')}>
            プロジェクト名 {renderSortIcon('name')}
          </th>
          <th
            className="p-2 cursor-pointer"
            onClick={() => onSort('createdAt')}
          >
            作成日時 {renderSortIcon('createdAt')}
          </th>
        </tr>
      </thead>
      <tbody>
        {prototypeList.map(({ project, masterPrototype }) => (
          <tr
            key={project.id}
            className="border-b hover:bg-kibako-tertiary/5 cursor-pointer"
            onClick={() => onRowClick(project.id, masterPrototype.id)}
          >
            <td className="p-2">{masterPrototype.name}</td>
            <td className="p-2">
              {formatDate(masterPrototype.createdAt, true)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProjectTable;
