// Last Modified: 2025-11-24 00:00
import React, { useState, useDeferredValue, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  Star,
  StarOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { NoResults } from '@/components/empty-states';
import { useContactsStore, Contact } from '@/stores/contactsStore';

interface ContactsTableProps {
  onViewContact?: (contact: Contact) => void;
  onEditContact?: (contact: Contact) => void;
}

export function ContactsTable({ onViewContact, onEditContact }: ContactsTableProps) {
  const { contacts, toggleFavorite, deleteContact } = useContactsStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  // Defer the search query to keep input responsive
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const isPendingSearch = globalFilter !== deferredGlobalFilter;

  // Filter contacts using deferred search term
  const filteredContacts = useMemo(() => {
    if (!deferredGlobalFilter.trim()) {
      return contacts;
    }

    const lowerCaseFilter = deferredGlobalFilter.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowerCaseFilter) ||
      contact.email.toLowerCase().includes(lowerCaseFilter) ||
      contact.phone.toLowerCase().includes(lowerCaseFilter) ||
      contact.company?.toLowerCase().includes(lowerCaseFilter) ||
      contact.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilter))
    );
  }, [contacts, deferredGlobalFilter]);

  const columns: ColumnDef<Contact, any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback>
                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{contact.name}</div>
              {contact.company && (
                <div className="text-xs text-muted-foreground">{contact.company}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <a
          href={`mailto:${row.getValue('email')}`}
          className="flex items-center gap-2 text-sm hover:text-primary"
        >
          <Mail className="w-4 h-4" />
          {row.getValue('email')}
        </a>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <a
          href={`tel:${row.getValue('phone')}`}
          className="flex items-center gap-2 text-sm hover:text-primary"
        >
          <Phone className="w-4 h-4" />
          {row.getValue('phone')}
        </a>
      ),
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const tags = row.getValue('tags') as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'relationshipScore',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Score
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => {
        const score = row.getValue('relationshipScore') as number;
        const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
        return (
          <div className={`font-medium ${color}`}>
            {score}%
          </div>
        );
      },
    },
    {
      accessorKey: 'lastContactDate',
      header: ({ column }) => {
        return (
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Contact
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="w-4 h-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 opacity-50" />
            )}
          </button>
        );
      },
      cell: ({ row }) => {
        const dateStr = row.getValue('lastContactDate') as string;
        const date = new Date(dateStr);
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, 'MMM d, yyyy')}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onViewContact?.(contact)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditContact?.(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contact
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteContact(contact.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredContacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const hasSearchQuery = globalFilter && globalFilter.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm">
          <Input
            placeholder="Search contacts..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full"
          />
          {isPendingSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isPendingSearch && (
            <span className="text-sm text-muted-foreground">Searching...</span>
          )}
          {Object.keys(rowSelection).length > 0 && (
            <Badge variant="secondary">
              {Object.keys(rowSelection).length} selected
            </Badge>
          )}
        </div>
      </div>

      {/* Show NoResults when searching with no results */}
      {hasSearchQuery && filteredRows.length === 0 ? (
        <NoResults
          searchQuery={globalFilter}
          onClearSearch={() => setGlobalFilter('')}
        />
      ) : (
        <>
          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No contacts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}