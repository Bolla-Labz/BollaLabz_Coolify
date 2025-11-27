// Last Modified: 2025-11-24 00:00
/**
 * VirtualTable Component
 * High-performance table with virtual scrolling for 100,000+ rows
 * Features: sorting, filtering, column resizing, cell editing
 * Optimized with React 18's useDeferredValue for smooth scrolling
 */

import React, { useMemo, useState, useCallback, useRef, useEffect, useDeferredValue } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ColumnResizeMode,
} from '@tanstack/react-table';
import { List } from 'react-window';
import { AutoSizer } from './AutoSizer';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Search,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Columns,
  Settings,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InteractiveButton } from '@/components/interactive/buttons/InteractiveButton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChartLoadingOverlay } from '@/lib/utils/chart-optimization';

// ============================================
// TYPES
// ============================================

export interface VirtualTableColumn<T = any> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  pinned?: 'left' | 'right';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  cell?: (value: any, row: T) => React.ReactNode;
  editor?: 'text' | 'number' | 'select' | 'date' | 'boolean';
  editorOptions?: any;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format?: (value: any) => string;
  className?: string;
}

export interface VirtualTableProps<T = any> {
  data: T[];
  columns: VirtualTableColumn<T>[];

  // Features
  features?: {
    virtualScroll?: boolean;
    infiniteScroll?: boolean;
    columnReorder?: boolean;
    rowReorder?: boolean;
    multiSort?: boolean;
    globalSearch?: boolean;
    rowSelection?: boolean | 'single' | 'multiple';
    expandableRows?: boolean;
    grouping?: boolean;
    aggregation?: boolean;
    export?: boolean;
    print?: boolean;
    columnVisibility?: boolean;
    density?: boolean;
    stickyHeader?: boolean;
  };

  // Performance
  rowHeight?: number | ((index: number) => number);
  estimatedRowHeight?: number;
  overscan?: number;
  debounceFilter?: number;

  // Callbacks
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onCellEdit?: (row: T, column: string, value: any) => void | Promise<void>;
  onSelectionChange?: (selected: T[]) => void;
  onSort?: (column: string, direction: 'asc' | 'desc' | null) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (format: string, data: T[]) => void;

  // Styling
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  compact?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: (row: T, index: number) => string;

  // Loading & Empty states
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;

  // Pagination (if not using virtual scroll)
  pageSize?: number;
  pageSizes?: number[];
}

// ============================================
// CELL RENDERERS
// ============================================

const EditableCell: React.FC<{
  value: any;
  row: any;
  column: any;
  onEdit: (value: any) => void;
}> = ({ value: initialValue, row, column, onEdit }) => {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = useCallback(() => {
    onEdit(value);
    setIsEditing(false);
  }, [value, onEdit]);

  const handleCancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  if (!isEditing) {
    return (
      <div
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded"
        onClick={() => setIsEditing(true)}
      >
        {column.format ? column.format(value) : value}
      </div>
    );
  }

  switch (column.editor) {
    case 'text':
    case 'number':
      return (
        <Input
          type={column.editor}
          value={value}
          onChange={(e) => setValue(column.editor === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="h-7 text-sm"
          autoFocus
        />
      );

    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => {
            setValue(e.target.checked);
            onEdit(e.target.checked);
            setIsEditing(false);
          }}
          className="w-4 h-4"
        />
      );

    default:
      return <div>{value}</div>;
  }
};

const SelectionCell: React.FC<{
  row: any;
  table: any;
}> = ({ row, table }) => {
  const isSelected = row.getIsSelected();
  const isSomeSelected = row.getIsSomeSelected();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        row.toggleSelected();
      }}
      className="p-1"
    >
      {isSelected ? (
        <CheckSquare className="w-4 h-4 text-blue-600" />
      ) : isSomeSelected ? (
        <MinusSquare className="w-4 h-4 text-blue-600" />
      ) : (
        <Square className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  features = {
    virtualScroll: true,
    multiSort: true,
    globalSearch: true,
    rowSelection: 'multiple',
    columnVisibility: true,
    export: true,
  },
  rowHeight = 40,
  estimatedRowHeight = 40,
  overscan = 5,
  debounceFilter = 300,
  onRowClick,
  onRowDoubleClick,
  onCellEdit,
  onSelectionChange,
  onSort,
  onFilter,
  onExport,
  striped = true,
  bordered = true,
  hover = true,
  compact = false,
  className,
  headerClassName,
  rowClassName,
  loading,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  pageSize = 50,
  pageSizes = [10, 25, 50, 100],
}: VirtualTableProps<T>) {
  const listRef = useRef<any>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');

  // Use React 18's useDeferredValue for non-blocking table updates
  const deferredData = useDeferredValue(data);
  const isDataStale = data !== deferredData;

  // Convert columns to TanStack format
  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = [];

    // Selection column
    if (features.rowSelection) {
      cols.push({
        id: 'selection',
        size: 40,
        header: ({ table }) => (
          <button
            onClick={table.getToggleAllRowsSelectedHandler()}
            className="p-1"
          >
            {table.getIsAllRowsSelected() ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : table.getIsSomeRowsSelected() ? (
              <MinusSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ),
        cell: ({ row, table }) => <SelectionCell row={row} table={table} />,
      });
    }

    // Data columns
    columns.forEach((col) => {
      cols.push({
        id: col.id,
        accessorFn: typeof col.accessor === 'function'
          ? col.accessor
          : (row) => row[col.accessor as keyof T],
        header: col.header,
        size: col.width,
        minSize: col.minWidth,
        maxSize: col.maxWidth,
        enableSorting: col.sortable !== false,
        enableColumnFilter: col.filterable !== false,
        enableResizing: col.resizable !== false,
        cell: ({ getValue, row, column }) => {
          const value = getValue();

          if (col.editor && onCellEdit) {
            return (
              <EditableCell
                value={value}
                row={row.original}
                column={col}
                onEdit={(newValue) => onCellEdit(row.original, col.id, newValue)}
              />
            );
          }

          if (col.cell) {
            return col.cell(value, row.original);
          }

          return col.format ? col.format(value) : value;
        },
      });
    });

    return cols;
  }, [columns, features.rowSelection, onCellEdit]);

  // Table instance using deferred data
  const table = useReactTable({
    data: deferredData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: features.virtualScroll ? undefined : getPaginationRowModel(),
    columnResizeMode: 'onChange' as ColumnResizeMode,
    enableMultiSort: features.multiSort,
  });

  // Get rows to display
  const rows = table.getRowModel().rows;

  // Handle selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selected = table.getSelectedRowModel().rows.map(row => row.original);
      onSelectionChange(selected);
    }
  }, [rowSelection, onSelectionChange]);

  // Export functionality (use deferred data for export)
  const handleExport = useCallback((format: string) => {
    const exportData = table.getSelectedRowModel().rows.length > 0
      ? table.getSelectedRowModel().rows.map(row => row.original)
      : deferredData;

    switch (format) {
      case 'csv':
        const csv = [
          columns.map(c => c.header).join(','),
          ...exportData.map(row =>
            columns.map(c => {
              const value = typeof c.accessor === 'function'
                ? c.accessor(row)
                : row[c.accessor as keyof T];
              return `"${value}"`;
            }).join(',')
          ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        break;

      case 'json':
        const json = JSON.stringify(exportData, null, 2);
        const jsonBlob = new Blob([json], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const link = document.createElement('a');
        link.href = jsonUrl;
        link.download = `table-export-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(jsonUrl);
        break;

      case 'clipboard':
        const text = exportData.map(row =>
          columns.map(c => {
            const value = typeof c.accessor === 'function'
              ? c.accessor(row)
              : row[c.accessor as keyof T];
            return value;
          }).join('\t')
        ).join('\n');
        navigator.clipboard.writeText(text);
        break;
    }

    onExport?.(format, exportData);
  }, [deferredData, columns, table, onExport]);

  // Row renderer for virtual scrolling
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = rows[index];
    if (!row) return null;

    return (
      <div
        style={style}
        className={cn(
          'flex items-center border-b border-gray-200 dark:border-gray-700',
          striped && index % 2 === 0 && 'bg-gray-50 dark:bg-gray-800/50',
          hover && 'hover:bg-gray-100 dark:hover:bg-gray-800',
          rowClassName?.(row.original, index)
        )}
        onClick={() => onRowClick?.(row.original, index)}
        onDoubleClick={() => onRowDoubleClick?.(row.original, index)}
      >
        {row.getVisibleCells().map(cell => (
          <div
            key={cell.id}
            className={cn(
              'px-3 overflow-hidden text-ellipsis whitespace-nowrap',
              density === 'compact' ? 'py-1 text-xs' : density === 'comfortable' ? 'py-3' : 'py-2 text-sm'
            )}
            style={{ width: cell.column.getSize() }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
      </div>
    );
  }, [rows, striped, hover, density, rowClassName, onRowClick, onRowDoubleClick]);

  // Calculate row height based on density
  const getRowHeight = useCallback((index: number) => {
    if (typeof rowHeight === 'function') return rowHeight(index);
    switch (density) {
      case 'compact': return 32;
      case 'comfortable': return 48;
      default: return rowHeight;
    }
  }, [rowHeight, density]);

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Global search */}
          {features.globalSearch && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 h-8 w-64"
              />
            </div>
          )}

          {/* Selection count */}
          {features.rowSelection && table.getSelectedRowModel().rows.length > 0 && (
            <Badge variant="secondary">
              {table.getSelectedRowModel().rows.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Density selector */}
          {features.density !== false && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton variant="ghost" size="sm" icon={Settings} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Table Density</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDensity('compact')}>
                  Compact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity('normal')}>
                  Normal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity('comfortable')}>
                  Comfortable
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column visibility */}
          {features.columnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton variant="ghost" size="sm" icon={Columns} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllColumns()
                  .filter(column => column.id !== 'selection')
                  .map(column => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {features.export && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <InteractiveButton variant="ghost" size="sm" icon={Download} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('clipboard')}>
                  Copy to Clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className={cn(
        'flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        features.stickyHeader && 'sticky top-0 z-10',
        headerClassName
      )}>
        {table.getHeaderGroups().map(headerGroup => (
          <React.Fragment key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <div
                key={header.id}
                className={cn(
                  'flex items-center justify-between px-3 font-medium text-gray-700 dark:text-gray-300',
                  density === 'compact' ? 'py-2 text-xs' : density === 'comfortable' ? 'py-4' : 'py-3 text-sm',
                  header.column.getCanSort() && 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                style={{ width: header.column.getSize() }}
                onClick={header.column.getToggleSortingHandler()}
              >
                <span className="flex items-center gap-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                    header.column.getIsSorted() === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  )}
                </span>

                {/* Column resize handle */}
                {header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className="absolute right-0 top-0 h-full w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize hover:bg-blue-500"
                  />
                )}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">{loadingMessage}</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">{emptyMessage}</div>
          </div>
        ) : (
          <>
            <div className={cn('h-full transition-opacity duration-200', isDataStale && 'opacity-70')}>
              {features.virtualScroll ? (
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      outerRef={listRef}
                      height={height}
                      width={width}
                      itemCount={rows.length}
                      itemSize={getRowHeight}
                      estimatedItemSize={estimatedRowHeight}
                      overscanCount={overscan}
                    >
                      {Row as any}
                    </List>
                  )}
                </AutoSizer>
              ) : (
                <div className="overflow-auto h-full">
                  {rows.map((row, index) => (
                    <Row key={row.id} index={index} style={{ height: getRowHeight(index) }} />
                  ))}
                </div>
              )}
            </div>

            {/* Loading overlay during data refresh */}
            <ChartLoadingOverlay isVisible={isDataStale} />
          </>
        )}
      </div>

      {/* Pagination (if not virtual scrolling) */}
      {!features.virtualScroll && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 text-sm"
            >
              {pageSizes.map(size => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              First
            </InteractiveButton>
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </InteractiveButton>
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </InteractiveButton>
            <InteractiveButton
              variant="ghost"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              Last
            </InteractiveButton>
          </div>
        </div>
      )}
    </div>
  );
}

export default VirtualTable;