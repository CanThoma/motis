import React, { useRef, useState, useEffect, createRef } from "react";

import "./navbar.css";

const Navbar = ({ pages, onChange, activePage }) => {
  return (
    <ul className="navbar">
      {pages.map((page, i) => (
        <li
          key={i}
          className={i === activePage ? "current" : ""}
          onClick={() => onChange(i)}
        >
          <button data-hover={page}>{page}</button>
        </li>
      ))}
    </ul>
  );
};

export default Navbar;
