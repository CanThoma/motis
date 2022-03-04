import React from "react";

import { Node } from "./SankeyTypes";
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
        currentDepatureTime: number;
      }
    | undefined;
};

const Modal = ({ setIsOpen, param }: Props): JSX.Element => {
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

              <div className="form-check">
                <input
                  className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
                  type="radio" name="flexRadioDefault" id="flexRadioDefault1"></input>
                  <label className="form-check-label inline-block text-gray-800" htmlFor="flexRadioDefault1">
                    Default radio
                  </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input appearance-none rounded-full h-4 w-4 border border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
                  type="radio" name="flexRadioDefault" id="flexRadioDefault2" checked></input>
                  <label className="form-check-label inline-block text-gray-800" htmlFor="flexRadioDefault2">
                    Default checked radio
                  </label>
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
