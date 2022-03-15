import React, { useState } from "react";

import Navbar from "../../../common/navbar";
import { Node } from "../SankeyTripTypes";
import "./Modal.styles.css";
import SankeyUmsteigerGraph from "../../UmsteigerGraph/SankeyUmsteigerGraph";
import { TripId } from "../../../../api/protocol/motis";

type NodeTripStationPointInfo = {
  node: Node;
  tripId: TripId;
  time: number;
};

type Props = {
  setIsOpen: (b: boolean) => void;
  param: NodeTripStationPointInfo | undefined;
};

/**
 * erstellt ein JSX element welches über der Seite angezeigt wird
 * @param setIsOpen State Funktion
 * @param param Objekt aus Node, tripId, Ankunftszeit und Abfahrtszeit
 * @constructor
 */
const Modal = ({ setIsOpen, param }: Props): JSX.Element => {
  const [currentPage, setCurrenPage] = useState(1);
  const [selectedDir, changeDir] = useState<"entering" | "both" | "exiting">(
    "both"
  );

  const pages = ["Einstiege", "Beide", "Ausstiege"];

  /**
   * Setzt die States currentPage und selectedDir welche die ausgewählte Seite speichern bzw. den Filter bestimmen.
   * @param i der index des Tabs der ausgewählt wurde
   */
  const setFilter = (i: number) => {
    switch (i) {
      case 0:
        changeDir("entering");
        setCurrenPage(0);
        break;
      case 1:
      default:
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
              <div className="5">
                <Navbar
                  pages={pages}
                  onChange={(i) => setFilter(i)}
                  activePage={currentPage}
                />
              </div>
            </div>
            <div className="app mt-8 text-center">
              {param && (
                <SankeyUmsteigerGraph
                  stationId={param.node.sId}
                  time={param.time}
                  onlyIncludeTripId={[param.tripId]}
                  tripDir={selectedDir}
                />
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="accept">
              Schließen
            </button>
            <div style={{ height: "50px", marginBottom: "-50px" }}>&#8202;</div>
          </div>
        </div>
      </>
    );
};

export default Modal;
