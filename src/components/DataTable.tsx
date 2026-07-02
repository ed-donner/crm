import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "./icons";
import { EmptyState } from "./ui";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  accessor?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  searchable?: boolean;
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  searchPlaceholder = "Search…",
  onRowClick,
  toolbar,
  emptyTitle = "Nothing here yet",
  emptySub,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptySub?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const tableColumns: ColumnDef<T>[] = columns.map((c) => ({
    id: c.key,
    header: c.header,
    enableSorting: c.sortable ?? false,
    enableGlobalFilter: c.searchable !== false,
    accessorFn: (row) =>
      c.accessor
        ? c.accessor(row)
        : (row as Record<string, unknown>)[c.key] ?? "",
    cell: ({ row }) =>
      c.cell ? (
        c.cell(row.original)
      ) : (
        <span className="cell-muted">
          {String((row.original as Record<string, unknown>)[c.key] ?? "—")}
        </span>
      ),
  }));

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div>
      <div className="toolbar">
        <div className="toolbar__search">
          <SearchIcon className="search-icon" size={16} />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            type="text"
            aria-label="Search"
          />
        </div>
        {toolbar}
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const col = header.column;
                  const sortable = col.columnDef.enableSorting;
                  const sorted = col.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={[
                        sortable ? "sortable" : "",
                        sorted ? "sorted" : "",
                        alignClass(columns.find((c) => c.key === header.column.id)?.align),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ width: columns.find((c) => c.key === header.column.id)?.width }}
                      onClick={sortable ? () => col.toggleSorting() : undefined}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && (
                        <span className={`sort-ind${sorted ? " active" : ""}`}>
                          {sorted === "asc" ? (
                            <ChevronUpIcon size={12} />
                          ) : sorted === "desc" ? (
                            <ChevronDownIcon size={12} />
                          ) : (
                            "↕"
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <EmptyState title={emptyTitle} sub={emptySub} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={onRowClick ? "row-clickable" : ""}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={alignClass(
                        columns.find((c) => c.key === cell.column.id)?.align,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function alignClass(align?: "left" | "right" | "center") {
  if (align === "right") return "ta-right";
  if (align === "center") return "ta-center";
  return "";
}
