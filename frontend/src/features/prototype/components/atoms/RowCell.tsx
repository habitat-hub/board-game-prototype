import React from 'react';

type RowCellProps = {
  className?: string;
  children: React.ReactNode;
};

const RowCell: React.FC<RowCellProps> = ({ className = '', children }) => {
  return (
    <td className={`px-4 py-2 align-middle ${className}`}>
      <div className="flex items-center gap-2 min-w-0">{children}</div>
    </td>
  );
};

export default RowCell;
