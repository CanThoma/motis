import React, { useState } from "react";

import Navbar from "./common/navbar";
import { Node } from "./SankeyTripTypes";
import "./Modal.styles.css";
import SankeyUmsteigerGraph from "./SankeyUmsteigerGraph";
import { TripId } from "../api/protocol/motis";

type Props = {
  setIsOpen: (b: boolean) => void;
  param:
    | {
        node: Node;
        tripId: TripId;
        currentArrivalTime: number;
        currentDepartureTime: number;
      }
    | undefined;
};

const Modal = ({ setIsOpen, param }: Props): JSX.Element => {
  const [currentPage, setCurrenPage] = useState(1);
  const [selectedDir, changeDir] = useState<"entering" | "both" | "exiting">(
    "both"
  );

  const pages = ["Einstiege", "Beide", "Ausstiege"];

  const filterBy = (i: number) => {
    switch (i) {
      case 0:
        changeDir("entering");
        setCurrenPage(0);
        break;
      case 1:
        changeDir("both");
        setCurrenPage(1);
        break;
      case 2:
        changeDir("exiting");
        setCurrenPage(2);
        break;
    }
  };

  if (typeof param === undefined) return <>not a node</>;
  else
    return (
      <>
        <div className="modal-backdrop " onClick={() => setIsOpen(false)} />
        <div className="container">
          <div className="modalContent">
            <p style={{ marginBottom: "10px" }}>
              {!param
                ? "not a Node"
                : "Ein- und Außstiege in Zug " +
                  param.tripId.train_nr +
                  "[" +
                  param.tripId.line_id +
                  "]" +
                  " an der Haltestelle " +
                  param.node.name +
                  ":"}
            </p>
            <div className="flex justify-center">
              <div className="flex place-content-center mx-auto mt-5">
                <Navbar
                  pages={pages}
                  onChange={(i) => filterBy(i)}
                  activePage={currentPage}
                />
              </div>
            </div>
            <div className="app mt-8 text-center">
              {param && (
                <SankeyUmsteigerGraph
                  stationId={param.node.sId}
                  currentArrivalTime={param.currentArrivalTime}
                  currentDepartureTime={param.currentDepartureTime}
                  maxCount={0}
                  onlyIncludeTripId={[param.tripId]}
                  tripDir={selectedDir}
                />
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="accept">
              Danke 👍
            </button>
            <div style={{ height: "50px", marginBottom: "-50px" }}>&#8202;</div>
          </div>
        </div>
      </>
    );
};

export default Modal;
