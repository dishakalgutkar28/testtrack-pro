import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage = 1, 
  lastPage = 1, 
  total = 0,
  perPage = 10,
  onPageChange,
  onLimitChange,
  hasMore = false
}) => {
  const pages = [];
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasMore || currentPage < lastPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  const handlePageInput = (e) => {
    const input = parseInt(e.target.value) || 1;
    const validPage = Math.min(Math.max(1, input), lastPage);
    onPageChange(validPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    if (onLimitChange) {
      onLimitChange(newLimit);
    }
  };

  if (lastPage === 1 && total === 0) {
    return null;
  }

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-total">
          Total: <strong>{total}</strong> items
        </span>
      </div>

      <div className="pagination-controls">
        {/* Previous Button */}
        <button 
          className="pagination-btn pagination-btn-prev"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Previous page"
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        <div className="pagination-numbers">
          {startPage > 1 && (
            <>
              <button 
                className="pagination-btn pagination-num"
                onClick={() => handlePageClick(1)}
              >
                1
              </button>
              {startPage > 2 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {pages.map(page => (
            <button
              key={page}
              className={`pagination-btn pagination-num ${
                page === currentPage ? 'active' : ''
              }`}
              onClick={() => handlePageClick(page)}
            >
              {page}
            </button>
          ))}

          {endPage < lastPage && (
            <>
              {endPage < lastPage - 1 && (
                <span className="pagination-ellipsis">...</span>
              )}
              <button 
                className="pagination-btn pagination-num"
                onClick={() => handlePageClick(lastPage)}
              >
                {lastPage}
              </button>
            </>
          )}
        </div>

        {/* Next Button */}
        <button 
          className="pagination-btn pagination-btn-next"
          onClick={handleNext}
          disabled={currentPage === lastPage || (lastPage === 0 && !hasMore)}
          title="Next page"
        >
          Next →
        </button>
      </div>

      <div className="pagination-options">
        {/* Items per page selector */}
        <div className="pagination-limit">
          <label htmlFor="limit-select">Items per page:</label>
          <select 
            id="limit-select"
            className="pagination-select"
            onChange={handleLimitChange}
            defaultValue="10"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        {/* Go to page input */}
        <div className="pagination-goto">
          <label htmlFor="goto-input">Go to page:</label>
          <input 
            id="goto-input"
            type="number"
            min="1"
            max={lastPage}
            className="pagination-input"
            onChange={handlePageInput}
            value={currentPage}
          />
          <span className="pagination-of">of {lastPage}</span>
        </div>
      </div>

      {/* Mobile compact view */}
      <div className="pagination-mobile">
        <span className="pagination-mobile-info">
          Page {currentPage} of {lastPage}
        </span>
        <div className="pagination-mobile-buttons">
          <button 
            className="pagination-btn pagination-btn-sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            ←
          </button>
          <button 
            className="pagination-btn pagination-btn-sm"
            onClick={handleNext}
            disabled={currentPage === lastPage}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
