import React from 'react';

type RowCellProps = {
  className?: string;
  children: React.ReactNode;
};

const RowCell: React.FC<RowCellProps> = ({ className = '', children }) => {
  return (
    <td className={`px-4 py-2 align-middle flex items-center ${className}`}>
      {children}
    </td>
  );
};

export default RowCell;
