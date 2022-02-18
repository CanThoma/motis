import React from "react";

import { Node } from "./SankeyTypes";
import "./Modal.styles.css";
import SankeyUmsteigerGraph from "./SankeyUmsteigerGraph"
import {TripId} from "../api/protocol/motis";

type Props = {
  setIsOpen: (b: boolean) => void;
  param: { node: Node , tripId: TripId, time: number} | undefined;
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
                time={param.time}
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
