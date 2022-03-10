import React from "react";

import Navbar from "./common/navbar";
import { Node } from "./SankeyTypes";
import "./Modal.styles.css";
import SankeyUmsteigerGraph from "./SankeyUmsteigerGraph";
import { TripId } from "../api/protocol/motis";

const filterBy = (i: number) => {};
type Props = {
  setIsOpen: (b: boolean) => void;
  param:
    | {
        node: Node;
        tripId: TripId;
        currentArrivalTime: number;
        currentDepatureTime: number;
      }
    | undefined;
};

const Modal = ({ setIsOpen, param }: Props): JSX.Element => {
  const pages = ["Einstiege", "Beide", "Ausstiege"];
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
              <div className="flex place-content-center mx-auto mt-20">
                <Navbar
                  pages={pages}
                  onChange={(i) => filterBy(i)}
                  activePage={1}
                />
              </div>
            </div>
            <div className="app mt-16 text-center">
              {param && (
                <SankeyUmsteigerGraph
                  stationId={param.node.sId}
                  currentArrivalTime={param.currentArrivalTime}
                  currentDepatureTime={param.currentDepatureTime}
                  maxCount={0}
                  onlyIncludeTripId={[param.tripId]}
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
