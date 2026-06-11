import React from 'react';

export const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 0) return null;

  return (
    <div className="flex items-center justify-between p-4 border-t border-border-subtle bg-bg-secondary text-sm">
      <div className="flex items-center gap-2">
        <span className="text-text-secondary">Hiển thị:</span>
        <select 
          className="bg-bg-primary border border-border-subtle rounded px-2 py-1 text-text-primary focus:outline-none focus:border-brand-primary"
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-text-secondary">dòng</span>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 rounded border border-border-subtle bg-bg-primary text-text-secondary disabled:opacity-50 hover:bg-glass-hover"
        >
          Trước
        </button>
        
        {getPageNumbers().map((page, idx) => (
          <button
            key={idx}
            disabled={page === '...'}
            onClick={() => page !== '...' && onPageChange(page)}
            className={`px-3 py-1 rounded border ${
              page === currentPage 
                ? 'bg-brand-primary border-brand-primary text-white' 
                : page === '...' 
                  ? 'border-transparent text-text-tertiary cursor-default'
                  : 'bg-bg-primary border-border-subtle text-text-secondary hover:bg-glass-hover'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button 
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 rounded border border-border-subtle bg-bg-primary text-text-secondary disabled:opacity-50 hover:bg-glass-hover"
        >
          Sau
        </button>
      </div>
    </div>
  );
};
