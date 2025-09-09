import { ChangeEvent } from 'react';

export type SortKey =
  | 'name'
  | 'createdAt'
  | 'partCount'
  | 'roomCount'
  | 'creator';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  label: string;
  value: `${SortKey}_${SortOrder}`;
  key: SortKey;
  order: SortOrder;
}

const sortOptions: SortOption[] = [
  {
    label: '作成日時(新しい順)',
    value: 'createdAt_desc',
    key: 'createdAt',
    order: 'desc',
  },
  {
    label: '作成日時(古い順)',
    value: 'createdAt_asc',
    key: 'createdAt',
    order: 'asc',
  },
  { label: '名前(昇順)', value: 'name_asc', key: 'name', order: 'asc' },
  { label: '名前(降順)', value: 'name_desc', key: 'name', order: 'desc' },
  {
    label: 'パーツ数(多い順)',
    value: 'partCount_desc',
    key: 'partCount',
    order: 'desc',
  },
  {
    label: 'パーツ数(少ない順)',
    value: 'partCount_asc',
    key: 'partCount',
    order: 'asc',
  },
  {
    label: 'ルーム数(多い順)',
    value: 'roomCount_desc',
    key: 'roomCount',
    order: 'desc',
  },
  {
    label: 'ルーム数(少ない順)',
    value: 'roomCount_asc',
    key: 'roomCount',
    order: 'asc',
  },
  {
    label: '作成者(昇順)',
    value: 'creator_asc',
    key: 'creator',
    order: 'asc',
  },
  {
    label: '作成者(降順)',
    value: 'creator_desc',
    key: 'creator',
    order: 'desc',
  },
];

interface SortDropdownProps {
  sortKey: SortKey;
  sortOrder: SortOrder;
  onChange: (key: SortKey, order: SortOrder) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  sortKey,
  sortOrder,
  onChange,
}) => {
  const currentValue = `${sortKey}_${sortOrder}` as const;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = sortOptions.find((o) => o.value === e.target.value);
    if (selected) {
      onChange(selected.key, selected.order);
    }
  };

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      className="rounded border border-kibako-secondary/30 bg-white px-2 py-1 text-sm"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SortDropdown;
