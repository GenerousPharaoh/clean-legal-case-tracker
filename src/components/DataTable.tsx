import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Checkbox,
  IconButton,
  Typography,
  Tooltip,
  Toolbar,
  alpha,
  CircularProgress,
  TextField,
  InputAdornment,
  useTheme,
  Chip,
  Skeleton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import { visuallyHidden } from '@mui/utils';
import { animations } from '../styles/visualRefactor';

// Define the types for the table
export interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  disablePadding?: boolean;
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  title?: string;
  selectable?: boolean;
  loading?: boolean;
  searchable?: boolean;
  dense?: boolean;
  initialSortBy?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedKeys: Array<T[keyof T]>) => void;
  onDeleteSelected?: (selectedKeys: Array<T[keyof T]>) => void;
  renderRowActions?: (row: T) => React.ReactNode;
}

// Define order type
type Order = 'asc' | 'desc';

/**
 * DataTable - A modern, accessible, and feature-rich data table component
 * 
 * Provides sorting, filtering, pagination, selection, and other features
 * with consistent styling and accessibility.
 */
function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  title,
  selectable = false,
  loading = false,
  searchable = false,
  dense = false,
  initialSortBy,
  initialSortDirection = 'asc',
  pagination = true,
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultRowsPerPage = 10,
  emptyMessage = 'No data available',
  onRowClick,
  onSelectionChange,
  onDeleteSelected,
  renderRowActions
}: DataTableProps<T>) {
  const theme = useTheme();
  const isMobile = window.innerWidth < 600;

  // States
  const [order, setOrder] = useState<Order>(initialSortDirection);
  const [orderBy, setOrderBy] = useState<keyof T | null>(initialSortBy || null);
  const [selected, setSelected] = useState<Array<T[keyof T]>>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset page when data changes
  useEffect(() => {
    setPage(0);
  }, [data.length, searchQuery]);

  // Filter the data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const lowercasedQuery = searchQuery.toLowerCase();
    return data.filter(row => {
      return columns.some(column => {
        if (column.id === 'actions' || !column.filterable) return false;
        
        const value = row[column.id as keyof T];
        if (value === null || value === undefined) return false;
        
        return String(value).toLowerCase().includes(lowercasedQuery);
      });
    });
  }, [data, searchQuery, columns]);

  // Sort the data
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      // Handle nullish values
      if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;
      
      // Compare based on type
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      return order === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [filteredData, orderBy, order]);

  // Paginate the data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage, pagination]);

  // Handlers
  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = sortedData.map(row => row[keyField]);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
      return;
    }
    setSelected([]);
    onSelectionChange?.([]);
  };

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>, row: T) => {
    if (!selectable && onRowClick) {
      onRowClick(row);
      return;
    }
    
    if (selectable) {
      const key = row[keyField];
      const selectedIndex = selected.indexOf(key);
      let newSelected: Array<T[keyof T]> = [];

      if (selectedIndex === -1) {
        newSelected = [...selected, key];
      } else {
        newSelected = [...selected.slice(0, selectedIndex), ...selected.slice(selectedIndex + 1)];
      }

      setSelected(newSelected);
      onSelectionChange?.(newSelected);
      
      // If there's also a row click handler, call it
      if (onRowClick) {
        onRowClick(row);
      }
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteSelected = () => {
    onDeleteSelected?.(selected);
    setSelected([]);
  };

  const isSelected = (key: T[keyof T]) => selected.indexOf(key) !== -1;

  // Empty rows for maintaining height consistency
  const emptyRows = pagination && paginatedData.length < rowsPerPage 
    ? rowsPerPage - paginatedData.length 
    : 0;

  // Determine what columns to show based on screen size
  const visibleColumns = useMemo(() => {
    return columns.filter(column => !(isMobile && column.hideOnMobile));
  }, [columns, isMobile]);

  // Toolbar component
  const EnhancedTableToolbar = () => {
    const numSelected = selected.length;

    return (
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          pt: 2,
          pb: 1,
          ...(numSelected > 0 && {
            bgcolor: (theme) =>
              alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2),
          }),
        }}
      >
        {numSelected > 0 ? (
          <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
          >
            {numSelected} selected
          </Typography>
        ) : (
          <Typography
            sx={{ flex: '1 1 100%', fontWeight: 500 }}
            variant="h6"
            id="tableTitle"
            component="div"
          >
            {title}
          </Typography>
        )}

        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton onClick={handleDeleteSelected} aria-label="delete selected items">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            {searchable && (
              <Box sx={{ maxWidth: 300, mr: 1, ml: 'auto' }}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                    },
                  }}
                />
              </Box>
            )}
            <Tooltip title="Filter list">
              <IconButton aria-label="filter list">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Toolbar>
    );
  };

  return (
    <Box sx={{ width: '100%', ...animations.fadeIn }}>
      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        {(title || selectable || searchable) && <EnhancedTableToolbar />}
        
        <TableContainer sx={{ maxHeight: pagination ? 'calc(100vh - 200px)' : undefined }}>
          <Table
            stickyHeader
            aria-labelledby={title ? 'tableTitle' : undefined}
            size={dense ? 'small' : 'medium'}
            sx={{ minWidth: 500 }}
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < sortedData.length}
                      checked={sortedData.length > 0 && selected.length === sortedData.length}
                      onChange={handleSelectAllClick}
                      inputProps={{
                        'aria-label': 'select all',
                      }}
                    />
                  </TableCell>
                )}
                
                {visibleColumns.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    padding={column.disablePadding ? 'none' : 'normal'}
                    style={{ 
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                    }}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    {column.sortable !== false ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id as keyof T)}
                      >
                        {column.label}
                        {orderBy === column.id ? (
                          <Box component="span" sx={visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} tabIndex={-1}>
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Skeleton variant="rectangular" width={24} height={24} />
                      </TableCell>
                    )}
                    {visibleColumns.map((column, colIndex) => (
                      <TableCell key={`cell-${index}-${colIndex}`}>
                        <Skeleton 
                          variant="text" 
                          width={column.minWidth || (colIndex === 0 ? 150 : 100)} 
                          height={24} 
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                // Data rows
                paginatedData.map((row, index) => {
                  const isItemSelected = isSelected(row[keyField]);
                  const labelId = `table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleRowClick(event, row)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={String(row[keyField])}
                      selected={isItemSelected}
                      sx={{ 
                        cursor: (selectable || onRowClick) ? 'pointer' : 'default',
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        },
                        '&.Mui-selected:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        },
                      }}
                    >
                      {selectable && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{
                              'aria-labelledby': labelId,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => {
                              const key = row[keyField];
                              const selectedIndex = selected.indexOf(key);
                              let newSelected: Array<T[keyof T]> = [];

                              if (selectedIndex === -1) {
                                newSelected = [...selected, key];
                              } else {
                                newSelected = [
                                  ...selected.slice(0, selectedIndex),
                                  ...selected.slice(selectedIndex + 1),
                                ];
                              }

                              setSelected(newSelected);
                              onSelectionChange?.(newSelected);
                            }}
                          />
                        </TableCell>
                      )}
                      
                      {visibleColumns.map((column) => {
                        // Handle the actions column
                        if (column.id === 'actions') {
                          return (
                            <TableCell 
                              key={`${row[keyField]}-actions`}
                              align={column.align || 'right'}
                              padding={column.disablePadding ? 'none' : 'normal'}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderRowActions ? renderRowActions(row) : null}
                            </TableCell>
                          );
                        }
                        
                        // Handle regular data columns
                        const value = row[column.id as keyof T];
                        return (
                          <TableCell
                            key={`${row[keyField]}-${String(column.id)}`}
                            align={column.align || 'left'}
                            padding={column.disablePadding ? 'none' : 'normal'}
                            {...(column.id === keyField ? { id: labelId } : {})}
                            sx={{
                              ...(column.maxWidth ? {
                                maxWidth: column.maxWidth,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              } : {})
                            }}
                          >
                            {column.format ? column.format(value) : value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              ) : (
                // Empty state
                <TableRow
                  style={{
                    height: dense ? 33 * emptyRows : 53 * emptyRows,
                  }}
                >
                  <TableCell
                    colSpan={visibleColumns.length + (selectable ? 1 : 0)}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {pagination && (
          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={sortedData.length}
            rowsPerPage={rowsPerPage}
            page={sortedData.length <= rowsPerPage * page ? 0 : page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            showFirstButton
            showLastButton
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          />
        )}
      </Paper>
    </Box>
  );
}

export default DataTable;
