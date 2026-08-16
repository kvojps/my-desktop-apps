import { Box, Pagination as MuiPagination } from '@mui/material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      <MuiPagination
        page={currentPage}
        count={totalPages}
        onChange={(_, page) => onPageChange(page)}
        shape="rounded"
        color="primary"
      />
    </Box>
  );
}
