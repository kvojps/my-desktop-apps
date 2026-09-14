import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return (
    <nav className="negocio-pagination" aria-label="Paginação">
      <Button
        variant="ghost"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </Button>
      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          aria-label={`Página ${page}`}
        >
          {page}
        </Button>
      ))}
      <Button
        variant="ghost"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </Button>
    </nav>
  );
}
