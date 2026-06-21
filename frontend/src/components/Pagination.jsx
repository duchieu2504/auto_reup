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
          className="bg-bg-primary border border-border-subtle rounded-xl px-3 py-1.5 text-text-primary focus:outline-none focus:border-brand-primary cursor-pointer hover:bg-glass-hover transition-colors appearance-none shadow-sm font-medium"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238892b0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
          value={itemsPerPage}
          onChange={(e) => {
            onItemsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
        >
          <option className="bg-bg-secondary text-text-primary" value={10}>10</option>
          <option className="bg-bg-secondary text-text-primary" value={20}>20</option>
          <option className="bg-bg-secondary text-text-primary" value={50}>50</option>
          <option className="bg-bg-secondary text-text-primary" value={100}>100</option>
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
