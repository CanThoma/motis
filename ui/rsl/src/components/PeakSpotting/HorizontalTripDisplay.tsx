import React, { useRef, useEffect, useState } from "react";
import { select as d3Select } from "d3";
import { useQuery, useQueryClient } from "react-query";
import { DownloadIcon } from "@heroicons/react/solid";
import { useAtom } from "jotai";

import {
  formatLongDateTime,
  formatFileNameTime,
  formatTime,
} from "../../util/dateFormat";
import {
  PaxMonEdgeLoadInfoWithStats,
  PaxMonTripLoadInfoWithStats,
} from "../../data/loadInfo";
import { TripId } from "../../api/protocol/motis";
import {
  queryKeys,
  sendPaxMonTripLoadInfosRequest,
  sendPaxMonFilterTripsRequest,
  usePaxMonStatusQuery,
} from "../../api/paxmon";
import { addEdgeStatistics } from "../../util/statistics";
import { universeAtom } from "../../data/simulation";

import { colorSchema, peakSpottingConfig as config } from "../../config";

import { prepareEdges, formatEdgeInfo } from "./HorizontalTripDisplayUtils";
import WarningSymbol from "./HorizontalTripDisplaySymbols";

async function loadAndProcessTripInfo(universe: number, trip: TripId[]) {
  const res = await sendPaxMonFilterTripsRequest({
    universe: 0,
    ignore_past_sections: false,
    include_load_threshold: 0.0,
    critical_load_threshold: 1.0,
    crowded_load_threshold: 0.8,
    include_edges: true,
    sort_by: "FirstDeparture",
    max_results: 100,
    skip_first: 0,
  });
  const tli = res.load_infos[0];
  return addEdgeStatistics(tli);
}

const HorizontalTripDisplay = ({
  tripData,
  width,
  selectedTrip,
  onClick,
  height = 80,
}) => {
  const svgRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

  const train_infos = selectedTrip ? selectedTrip.tsi.service_infos : null;

  const onOverflow = (flag: boolean) => {
    setOverflow(flag);
  };

  const graphWidth =
    width - (config.horizontalLeftPadding + config.horizontalRightPadding);

  useEffect(() => {
    const data = prepareEdges({
      data: tripData,
      width: graphWidth,
      height,
      onOverflow,
    });

    const svg = d3Select(svgRef.current);
    // Säubern von potentiellen svg Inhalt
    svg.selectAll("*").remove();

    // Add a g.view for holding the sankey diagram.
    const view = svg.append("g").classed("view", true);

    // Errechnen der effektiven Breite:
    // Gesamtlänge minus die Breite des Panels für Zugname und so.
    //...

    // Einteilen in 24h --> für anschließendes Mapping der Uhrzeit auf einen Zeitstrahl
    for (let i = 0; i < config.timeFrame; i++) {
      let opacity = 0;

      if (i % 2 == 0 && i > 5) {
        opacity = 1;
      }

      view
        .append("rect")
        .attr("x", graphWidth * (i / config.timeFrame))
        .attr("y", height / 2 - 5)
        .attr("height", 10)
        .attr("width", 2)
        .attr("fill", colorSchema.lightGrey)
        .attr("opacity", opacity);
    }

    for (const edge of data) {
      const tim = view
        .append("rect")
        .attr("x", edge.x)
        .attr("y", height - edge.capHeight)
        .attr("height", edge.capHeight)
        .attr("width", edge.width)
        .attr("fill", colorSchema.lightGrey);

      const tom = view
        .append("rect")
        .attr("x", edge.x)
        .attr("y", edge.y) // height - edge.expectedPassengers / config.horizontalCapacityScale)
        .attr("height", edge.height)
        .attr("width", edge.width)
        .attr("fill", edge.colour)
        .attr("opacity", edge.opacity ? edge.opacity : 1);

      tom.append("title").text(formatEdgeInfo(edge));
      tim
        .append("title")
        .text(
          `${edge.from.name} \u279E ${edge.to.name}\n${edge.expectedPassengers} erwartete Passagiere`
        );
    }

    // Anhängen der ersten Station
    view
      .append("text")
      .text(data[0].from.name)
      .attr("dx", "-0.35em")
      .attr("fill", colorSchema.darkBluishGrey)
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("font-family", config.font_family)
      .attr("x", data[0].x)
      .attr("y", height - data[0].capHeight / 2);

    // Anhängen der letzten Station
    view
      .append("text")
      .text(data[data.length - 1].to.name)
      .attr("dx", "0.35em")
      .attr("fill", colorSchema.darkBluishGrey)
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-family", config.font_family)
      .attr("x", data[data.length - 1].x + data[data.length - 1].width)
      .attr("y", height - data[0].capHeight / 2);
  }, []);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colorSchema.white,
        border: "2px solid",
        borderColor: colorSchema.white,
        width: width,
        fontFamily: config.font_family,
        marginBottom: "5px",
        display: "flex",
        boxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        WebkitBoxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        MozBoxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        cursor: "pointer",
      }}
      //className="tripRow grid grid-flow-col"
      className={
        train_infos === tripData.tsi.service_infos
          ? "horizontalTripSelected tripRow grid grid-flow-col"
          : "tripRow grid grid-flow-col"
      }
    >
      <div
        className="grid grid-flow-col"
        style={{
          width: `${config.horizontalLeftPadding}px`,
          paddingLeft: "15px",
          justifyContent: "left",
        }}
      >
        <div
          style={{
            margin: "auto",
            width: "80px",
          }}
        >
          <h3
            style={{
              color: colorSchema.grey,
              fontSize: "24px",
              lineHeight: 0.9,
            }}
            data-tooltip="Die Zuchnummer"
            data-tooltip-location="top"
          >
            {tripData.tsi.service_infos[0].train_nr}
          </h3>
          <p
            style={{ color: colorSchema.darkBluishGrey, fontWeight: "bold" }}
            data-tooltip="Der Zuchname"
            data-tooltip-location="top"
          >
            {tripData.tsi.service_infos[0].name}
          </p>
        </div>
        {overflow && (
          <WarningSymbol color="#ef1d18" symbol="excess" width={15} />
        )}
        {tripData.critical_sections > 0 && (
          <WarningSymbol color="#ff8200" symbol="critical" width={15} />
        )}
        {tripData.crowded_sections > 0 && (
          <WarningSymbol color="#444444" symbol="crowded" width={15} />
        )}
      </div>
      <div>
        <svg
          ref={svgRef}
          width={graphWidth}
          height={height}
          className="m-auto"
        />
      </div>
    </div>
  );
};

export default HorizontalTripDisplay;
