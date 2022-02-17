import React from "react";

import { Node } from "./SankeyTypes";
import "./Modal.styles.css";
import SankeyUmsteigerGraph from "./SankeyUmsteigerGraph"
import {TripId} from "../api/protocol/motis";

const someDate = new Date("Mon, 25 Oct 2021 09:15:00 GMT+2");
const theUnixTime = someDate.getTime() / 1000;
const aTime = theUnixTime - (theUnixTime % 1800); // dd-mm-yy 9:19 -> dd-mm-yy 9:00 ( this example timestamp 25-10-2021 9:15)
const bTime = aTime + 30 * 60; // dd-mm-yy 9:30

type Props = {
  setIsOpen: (b: boolean) => void;
  param: { node: Node , tripId: TripId } | undefined;
};

const Modal = ({ setIsOpen, param }: Props): JSX.Element => {
  if (typeof param === undefined) return (
    <>
      not a node
    </>
  );
  else
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
            {param && param.node.name}
          </a>
          <p style={{ marginBottom: "10px" }}>
            Ich biete voll so hilfreiche Informationen für diesen Bahnhof!
          </p>
          <div className="app mt-16 text-center" >
            {param && (
              <SankeyUmsteigerGraph
                stationId={param.node.sId}
                time={aTime}
                maxCount={0}
                onlyIncludeTripId={[param.tripId]}
              />
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="accept">
            Danke 👍
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;
