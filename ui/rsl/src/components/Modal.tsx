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
            //src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Flogos-world.net%2Fwp-content%2Fuploads%2F2021%2F02%2FDeutsche-Bahn-Logo.png&f=1&nofb=1"
            src="https://img.pr0gramm.com/2016/09/11/2b7c3fefe833e987.jpg"
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
