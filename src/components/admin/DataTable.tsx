import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, Edit, Trash2, Eye, Download, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onBulkDelete?: (items: T[]) => void;
  onBulkApprove?: (items: T[]) => void;
  onBulkReject?: (items: T[]) => void;
  addLabel?: string;
  exportFileName?: string;
}

function exportToCSV<T extends { id: string }>(data: T[], columns: Column<T>[], filename: string) {
  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: any, k) => obj?.[k], item);
    }
    return item[key as keyof T];
  };

  const headers = columns.map(col => col.header).join(',');
  const rows = data.map(item => 
    columns.map(col => {
      const val = getValue(item, col.key);
      const strVal = String(val ?? '').replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  toast.success(`Exported ${data.length} rows to CSV`);
}

function exportToExcel<T extends { id: string }>(data: T[], columns: Column<T>[], filename: string) {
  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: any, k) => obj?.[k], item);
    }
    return item[key as keyof T];
  };

  // Create XML for Excel
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
  xml += '<Worksheet ss:Name="Sheet1"><Table>';
  
  // Headers
  xml += '<Row>';
  columns.forEach(col => {
    xml += `<Cell><Data ss:Type="String">${col.header}</Data></Cell>`;
  });
  xml += '</Row>';
  
  // Data rows
  data.forEach(item => {
    xml += '<Row>';
    columns.forEach(col => {
      const val = getValue(item, col.key);
      xml += `<Cell><Data ss:Type="String">${String(val ?? '').replace(/[<>&]/g, '')}</Data></Cell>`;
    });
    xml += '</Row>';
  });
  
  xml += '</Table></Worksheet></Workbook>';
  
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xls`;
  link.click();
  toast.success(`Exported ${data.length} rows to Excel`);
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKey,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onBulkDelete,
  onBulkApprove,
  onBulkReject,
  addLabel = 'Add New',
  exportFileName = 'export',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const perPage = 10;

  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj: any, k) => obj?.[k], item);
    }
    return item[key as keyof T];
  };

  const filteredData = searchKey
    ? data.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      )
    : data.filter((item) =>
        columns.some((column) => {
          const value = getValue(item, column.key);
          return value && String(value).toLowerCase().includes(search.toLowerCase());
        })
      );

  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectedItems = data.filter(item => selectedIds.has(item.id));
  const hasBulkActions = onBulkDelete || onBulkApprove || onBulkReject;

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedItems.length > 0) {
      onBulkDelete(selectedItems);
      setSelectedIds(new Set());
    }
  };

  const handleBulkApprove = () => {
    if (onBulkApprove && selectedItems.length > 0) {
      onBulkApprove(selectedItems);
      setSelectedIds(new Set());
    }
  };

  const handleBulkReject = () => {
    if (onBulkReject && selectedItems.length > 0) {
      onBulkReject(selectedItems);
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Bulk Actions */}
          {hasBulkActions && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              {onBulkApprove && (
                <Button variant="outline" size="sm" onClick={handleBulkApprove} className="gap-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Approve
                </Button>
              )}
              {onBulkReject && (
                <Button variant="outline" size="sm" onClick={handleBulkReject} className="gap-1">
                  <XCircle className="w-4 h-4 text-warning" />
                  Reject
                </Button>
              )}
              {onBulkDelete && (
                <Button variant="outline" size="sm" onClick={handleBulkDelete} className="gap-1 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportToCSV(filteredData, columns, exportFileName)}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(filteredData, columns, exportFileName)}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportToCSV(selectedItems, columns, `${exportFileName}_selected`)} disabled={selectedIds.size === 0}>
                Export Selected (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {hasBulkActions && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={String(column.key)} className="font-semibold">
                  {column.header}
                </TableHead>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableHead className="w-12">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasBulkActions ? 2 : 1)}
                  className="text-center py-8 text-muted-foreground"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  {hasBulkActions && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item)
                        : getValue(item, column.key)}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(item)} className="gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                              <Edit className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{' '}
            {Math.min(page * perPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
