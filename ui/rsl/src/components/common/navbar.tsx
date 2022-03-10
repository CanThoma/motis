import React from "react";

import "./navbar.css";

const Navbar = (args: {
  pages: string[];
  onChange: (i: number) => void;
  activePage: number;
}) => {
  return (
    <ul className="navbar">
      {args.pages.map((page, i) => (
        <li
          key={i}
          className={i === args.activePage ? "current" : ""}
          onClick={() => args.onChange(i)}
        >
          <button data-hover={page}>{page}</button>
        </li>
      ))}
    </ul>
  );
};

export default Navbar;
