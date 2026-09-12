import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { pageWindow } from './pageWindow';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="money-pagination" aria-label="Paginação">
      <Button
        variant="ghost"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </Button>
      {pageWindow(currentPage, totalPages).map((page, index) =>
        page === 'gap' ? (
          <span key={`gap-${index}`} className="money-pagination-gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'secondary' : 'ghost'}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Página ${page}`}
          >
            {page}
          </Button>
        ),
      )}
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
