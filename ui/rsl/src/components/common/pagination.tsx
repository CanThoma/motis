import React from "react";
import { paginatorShowedButtonCount } from "../../config";

import "./pagination.css";
import { list } from "postcss";
import { active } from "d3";

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

  if (pageCount > paginatorShowedButtonCount + 4) {
    return (
      <nav className="mt-2 mb-3">
        <ul className="pagination">
          <li key={"page_<<"} className={"page-item"}>
            <button className="page-link" onClick={() => onPageChange(1)}>
              {"<<"}
            </button>
          </li>
          <li key={"page_<"} className={"page-item"}>
            <button
              className="page-link"
              onClick={() => {
                onPageChange(
                  Math.max(
                    currentPage -
                      (2 * Math.floor(paginatorShowedButtonCount / 2) - 1),
                    1
                  )
                );
              }}
            >
              {"<"}
            </button>
          </li>
          {pages
            .filter(
              (page) =>
                Math.abs(page - currentPage) <
                Math.floor(paginatorShowedButtonCount / 2)
            )
            .map((page) => (
              <li
                key={"page_" + page}
                className={
                  page === currentPage ? "page-item active" : "page-item"
                }
              >
                <button
                  className="page-link"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}
          <li key={"page_>"} className={"page-item"}>
            <button
              className="page-link"
              onClick={() =>
                onPageChange(
                  Math.min(
                    currentPage +
                      (2 * Math.floor(paginatorShowedButtonCount / 2) - 1),
                    pageCount
                  )
                )
              }
            >
              {">"}
            </button>
          </li>
          <li key={"page_>>"} className={"page-item"}>
            <button
              className="page-link"
              onClick={() => onPageChange(pageCount)}
            >
              {">>"}
            </button>
          </li>
        </ul>
      </nav>
    );
  } else {
    return (
      <nav className="mt-2 mb-3">
        <ul className="pagination">
          {pages.map((page) => (
            <li
              key={"page_" + page}
              className={
                page === currentPage ? "page-item active" : "page-item"
              }
            >
              <button className="page-link" onClick={() => onPageChange(page)}>
                {page}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
};

export default Pagination;
