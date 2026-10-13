import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  TablePagination, 
  Box, 
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const DataTable = ({ 
  columns, 
  data, 
  title, 
  searchPlaceholder = "Search...",
  rowsPerPageOptions = [5, 10, 25],
  initialRowsPerPage = 10,
  hideSearch = false,
  getRowClassName
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Debounce search term to prevent expensive re-renders on every keystroke
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredData = React.useMemo(() => {
    if (!debouncedSearchTerm) return data;
    const lowerSearch = debouncedSearchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (value) =>
          value && value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, debouncedSearchTerm]);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const displayedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box className="w-full space-y-4">
      {!hideSearch && (
        <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {title && (
            <Typography variant="h6" className="font-bold text-content-primary">
              {title}
            </Typography>
          )}
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon className="text-brand-text-secondary" />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: '12px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--bg-tertiary)'
              }
            }}
          />
        </Box>
      )}
      {hideSearch && title && (
        <Typography variant="h6" className="font-bold text-content-primary">
          {title}
        </Typography>
      )}

      <div className="w-full overflow-x-auto rounded-xl border border-border-subtle shadow-sm bg-surface">
        <Table className="w-full whitespace-nowrap" sx={{ width: '100%', tableLayout: 'auto' }}>
          <TableHead className="bg-background-secondary">
            <TableRow>
              {columns.map((column) => (
                <TableCell 
                  key={column.id}
                  className="py-3.5 px-4 text-content-secondary text-xs uppercase tracking-wider font-bold border-background-tertiary whitespace-nowrap"
                  align={column.align || 'left'}
                  sx={{ 
                    width: column.width || 'auto', 
                    minWidth: column.minWidth || 'auto', 
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedData.length > 0 ? (
              displayedData.map((row, index) => (
                <TableRow 
                  key={index}
                  className={`hover:bg-background-secondary/50 transition-colors ${getRowClassName ? getRowClassName(row) : ''}`}
                >
                  {columns.map((column) => (
                    <TableCell 
                      key={column.id}
                      align={column.align || 'left'}
                      className="py-3.5 px-4 text-content-primary border-background-tertiary text-sm whitespace-nowrap"
                      sx={{ 
                        width: column.width || 'auto', 
                        minWidth: column.minWidth || 'auto',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {column.render ? column.render(row) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" className="py-12 whitespace-nowrap">
                  <Typography className="text-brand-text-secondary">
                    No matching records found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        className="text-content-primary"
        sx={{ 
          '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
            color: 'var(--text-secondary)'
          },
          '.MuiTablePagination-select': {
            color: 'var(--text-primary)'
          }
        }}
      />
    </Box>
  );
};

export default DataTable;
