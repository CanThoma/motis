import React, { MouseEvent, useRef, useState } from "react";
import { select as d3Select } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey

import { Node, Link } from "./SankeyStationTypes";
import Utils from "./SankeyUmsteigerUtils";
import { TripId } from "../api/protocol/motis";
import { ExtractStationData } from "./StationInfoUtils";
import * as d3 from "d3";

type Props = {
  stationId: string;
  time:number;
  maxCount: number;
  onlyIncludeTripId: TripId[];
  //onTripSelected: (id: TripId | string, name: string) => void;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};



const SankeyUmsteigerGraph = ({
  stationId,
  time,
  maxCount,
  onlyIncludeTripId,
  width = 1200,
  height = 600,
  nodeWidth = 25,
  nodePadding = 15,
  duration = 250,
}: Props): JSX.Element => {

  const svgRef = useRef(null);
  const [svgHeightUmsteiger, setSvgHeight] = useState(600);

  const startTime = time - 2.5*60*60;
  const endTime = time + 2.5*60*60;

  const data = ExtractStationData({
    stationId: stationId,
    startTime: startTime,
    endTime: endTime,
    maxCount: 0,
    onlyIncludeTripIds:[... onlyIncludeTripId]
  });;

  React.useEffect(() => {
    const handleSvgResize = (newSize: number) => {
      setSvgHeight(newSize);
    };

    const graph = Utils.createGraph(
      {
        fNodes: data.fromNodes,
        tNodes: data.toNodes,
        links: data.links,
        onSvgResize: handleSvgResize,
        width,
        nodeWidth,
        nodePadding,
      }
    );

    console.log(graph)

  }, [data, height, width, nodeWidth, nodePadding, duration, svgHeightUmsteiger]);

  return (
    <>
      {!data && <div>Daten zum Zug nicht verfügbar</div>}
      {data && (
        <svg
          ref={svgRef}
          width={width}
          height={svgHeightUmsteiger}
          className="m-auto"
          style={{ marginBottom: "1.45rem" }} // TODO: das ist nur testweise wegen der besseren Lesbarkeit.
        />
      )}
    </>
  );
};

export default SankeyUmsteigerGraph;
