import React from "react";

import { Node } from "./SankeyTypes";
import "./Modal.styles.css";

type Props = {
  setIsOpen: (b: boolean) => void;
  node: Node | undefined;
};

const Modal = ({ setIsOpen, node }: Props): JSX.Element => {
  return (
    <>
      <div className="modal-backdrop" onClick={() => setIsOpen(false)} />
      <div className="container">
        <div className="modalContent">
          <img
            src="https://img.pr0gramm.com/2019/11/07/92c6aaca8934bea7.jpg"
            alt="Bierdurst!!!!"
          />
          <a href="https://de.wikipedia.org/wiki/Steinieform">
            {node && node.name}
          </a>
          <p style={{ marginBottom: "10px" }}>
            Ich biete voll so hilfreiche Informationen für diesen Bahnhof!
          </p>
          {node && <p>{node.totalNodeValue} Personen sind in mir.</p>}
          <button onClick={() => setIsOpen(false)} className="accept">
            Danke 👍
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;
