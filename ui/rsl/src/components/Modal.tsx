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
          <p style={{ marginBottom: "10px" }}>
            Personen die hier umgestiegen sind nahmen folgende Verbindungen:
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
