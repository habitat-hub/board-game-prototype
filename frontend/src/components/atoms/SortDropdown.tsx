import { ChangeEvent } from 'react';

// 並び替え対象キーの型（UI/ソートロジックで共有）
export type SortKey =
  | 'name'
  | 'createdAt'
  | 'partCount'
  | 'roomCount'
  | 'creator';
// 並び順の型（昇順 or 降順）
export type SortOrder = 'asc' | 'desc';

/** ドロップダウンの選択肢定義（表示ラベルとキー/順の組） */
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

/** ソート条件選択用ドロップダウンのProps */
interface SortDropdownProps {
  /** 現在のソート対象キー */
  sortKey: SortKey;
  /** 現在のソート順（昇順/降順） */
  sortOrder: SortOrder;
  /** 選択変更時に呼ばれるコールバック */
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
    <div className="relative inline-block">
      <select
        value={currentValue}
        onChange={handleChange}
        aria-label="並び替え"
        className="appearance-none rounded-md border border-kibako-secondary/30 bg-kibako-white px-3 py-2 pr-9 text-sm text-kibako-primary shadow-sm hover:border-kibako-accent/60 focus:outline-none focus:ring-2 focus:ring-kibako-accent/40 focus:border-kibako-accent/70 transition-colors"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-kibako-secondary"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 11.94 1.16l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.39a.75.75 0 01.02-1.18z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default SortDropdown;
