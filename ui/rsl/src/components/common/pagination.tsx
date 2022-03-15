import React from "react";

import "./pagination.css";

const Pagination = ({
  itemsCount,
  pageSize,
  currentPage,
  onPageChange,
}: {
  itemsCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}): JSX.Element | null => {
  const pageCount = Math.ceil(itemsCount / pageSize);

  const range = (x: number, y: number): number[] =>
    x > y ? [] : [x, ...range(x + 1, y)];

  if (pageCount === 1) return null;
  const pages = range(1, pageCount);
  return (
    <nav className="mt-2 mb-3">
      <ul className="pagination">
        {pages.map((page) => (
          <li
            key={"page_" + page}
            className={page === currentPage ? "page-item active" : "page-item"}
          >
            <button className="page-link" onClick={() => onPageChange(page)}>
              {page}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;
