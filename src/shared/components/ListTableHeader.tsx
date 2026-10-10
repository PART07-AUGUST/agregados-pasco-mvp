interface ListTableHeaderProps {
  columns: Array<{ label: string; align?: 'left' | 'right' }>;
}

export function ListTableHeader({ columns }: ListTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-slate-900 bg-slate-950/20 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {columns.map((column) => (
          <th key={column.label} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''}`}>
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
