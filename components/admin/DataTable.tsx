"use client";

import { cn } from "@/lib/utils";
import { TablePagination } from "@/components/admin/TablePagination";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  from?: number;
  to?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  page,
  totalPages,
  from,
  to,
  total,
  onPageChange,
}: DataTableProps<T>) {
  const showPagination =
    page !== undefined &&
    totalPages !== undefined &&
    from !== undefined &&
    to !== undefined &&
    total !== undefined &&
    onPageChange !== undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-primary/5">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-semibold text-muted"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-muted"
              >
                No data found
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "border-t border-border transition",
                  onRowClick && "cursor-pointer hover:bg-primary/5"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      {showPagination && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
