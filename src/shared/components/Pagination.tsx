import { useState, useId } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  itemLabel = 'registros',
}: PaginationProps) {
  const [targetInput, setTargetInput] = useState('');
  const inputId = useId();

  if (totalItems <= itemsPerPage) {
    return null;
  }

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems);

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(targetInput.trim(), 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setTargetInput('');
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 text-xs w-full">
      <span className="text-[11px] text-slate-400 font-mono">
        Mostrando <strong className="text-amber-400">{startIndex}-{endIndex}</strong> de{' '}
        <strong className="text-slate-200">{totalItems}</strong> {itemLabel}
      </span>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 transition-colors mr-1"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pageNumbers.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-600 font-mono select-none">
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[28px] h-7 px-2 font-mono text-[11px] font-bold rounded-lg border transition-colors ${isActive
                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 transition-colors ml-1"
          title="Página siguiente"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>

        <span className="text-slate-700 mx-1 hidden sm:inline">|</span>

        <form onSubmit={handleJumpSubmit} className="flex items-center gap-1 ml-1">
          <label htmlFor={inputId} className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Ir a:
          </label>
          <input
            id={inputId}
            type="number"
            min={1}
            max={totalPages}
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder={String(currentPage)}
            className="w-12 px-1.5 py-1 text-center font-mono text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-amber-400 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 transition-colors"
          />
          <button
            type="submit"
            className="px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-bold transition-colors cursor-pointer"
          >
            Ir
          </button>
        </form>
      </div>
    </div>
  );
}

export default Pagination;
