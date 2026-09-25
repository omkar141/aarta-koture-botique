import React from 'react';

const PAGE_SIZE_OPTIONS = [10, 50, 100, 500, 1000];

const TablePagination = ({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span>Select per page</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="border rounded px-2 py-1"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>{firstItem}-{lastItem} of {totalItems}</span>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn btn-small btn-secondary"
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-small btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TablePagination;