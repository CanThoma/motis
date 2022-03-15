import React, { useRef, useEffect } from "react";
import { select as d3Select } from "d3";
import { PaxMonFilteredTripInfo } from "../../api/protocol/motis/paxmon";

import {
  font_family,
  colorSchema,
  peakSpottingConfig as config,
} from "../../config";

import { prepareEdges, formatEdgeInfo } from "./HorizontalTripDisplayUtils";
import WarningSymbol from "./HorizontalTripDisplaySymbols";
import { TripId } from "../../api/protocol/motis";
import { useSankeyContext } from "../context/SankeyContext";

type Props = {
  width: number;
  trip: PaxMonFilteredTripInfo;
  selectedTrip: PaxMonFilteredTripInfo | undefined;
  onClick: () => void;
  onTripSelected?: () => void;
  height?: number;
};

const HorizontalTripDisplay = ({
  trip,
  width,
  selectedTrip,
  onClick,
  onTripSelected,
  height = 80,
}: Props): JSX.Element => {
  const svgRef = useRef(null);

  const train_infos = selectedTrip ? selectedTrip.tsi.service_infos : null;

  const graphWidth =
    width - (config.horizontalLeftPadding + config.horizontalRightPadding);

  const { setSelectedTrip, setTripName, setStartTime, setEndTime } =
    useSankeyContext();

  useEffect(() => {
    const data = prepareEdges({
      trip: trip,
      width: graphWidth,
      height,
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
      let tim;
      if (!edge.noCap) {
        tim = view
          .append("rect")
          .attr("x", edge.x || 0)
          .attr("y", height - (edge.capHeight || 0))
          .attr("height", edge.capHeight || 0)
          .attr("width", edge.horizontalWidth || 0)
          .attr("fill", colorSchema.lightGrey);
      }

      const tom = view
        .append("rect")
        .attr("x", edge.x || 0)
        .attr("y", edge.y || 0) // height - edge.expectedPassengers / config.horizontalCapacityScale)
        .attr("height", edge.height || 0)
        .attr("width", edge.horizontalWidth || 0)
        .attr("fill", edge.color || colorSchema.grey)
        .attr("opacity", edge.opacity ? edge.opacity : 1);

      tom.append("title").text(formatEdgeInfo(edge));
      if (tim) {
        tim
          .append("title")
          .text(
            `${edge.from.name} \u279E ${edge.to.name}\n${edge.expected_passengers} erwartete Passagiere`
          );
      }
    }

    // Anhängen der ersten Station
    view
      .append("text")
      .text(data[0].from.name)
      .attr("dx", "-0.35em")
      .attr("fill", colorSchema.darkBluishGrey)
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("font-family", font_family)
      .attr("x", data[0].x || 0)
      .attr("y", height - (data[0].capHeight || 0) / 2);

    // Anhängen der letzten Station
    view
      .append("text")
      .text(data[data.length - 1].to.name)
      .attr("dx", "0.35em")
      .attr("fill", colorSchema.darkBluishGrey)
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-family", font_family)
      .attr(
        "x",
        (data[data.length - 1].x || 0) +
          (data[data.length - 1].horizontalWidth || 0)
      )
      .attr("y", height - (data[0].capHeight || 0) / 2);
  }, [graphWidth, height, trip]);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colorSchema.white,
        border: "2px solid",
        borderColor: colorSchema.white,
        width: width,
        fontFamily: font_family,
        marginBottom: "5px",
        display: "flex",
        boxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        WebkitBoxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        MozBoxShadow: "0 0 13px rgba(255, 255, 255, 0.2) ",
        cursor: "pointer",
      }}
      //className="tripRow grid grid-flow-col"
      className={
        train_infos === trip.tsi.service_infos
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
            data-tooltip="Zum Tripgraphen"
            data-tooltip-location="top"
            onClick={() => {
              if (setTripName)
                setTripName(
                  `${trip.tsi.primary_station.name} \u2192 ${trip.tsi.secondary_station.name}`
                );
              if (setSelectedTrip) setSelectedTrip(trip.tsi.trip as TripId);
              if (onTripSelected) onTripSelected();

              const startTime = (trip.tsi.trip.time - 5 * 60) * 1000;
              const endTime = (trip.tsi.trip.time + 25 * 60) * 1000;

              if (setStartTime) setStartTime(new Date(startTime));
              if (setEndTime) setEndTime(new Date(endTime));
            }}
          >
            {trip.tsi.service_infos[0].train_nr}
          </h3>
          <p
            style={{ color: colorSchema.darkBluishGrey, fontWeight: "bold" }}
            data-tooltip="Der Zugname"
            data-tooltip-location="top"
          >
            {trip.tsi.service_infos[0].name}
          </p>
        </div>
        {trip.max_excess_pax > 0 && (
          <WarningSymbol color="#ef1d18" symbol="excess" width={15} />
        )}
        {trip.critical_sections > 0 && (
          <WarningSymbol color="#ff8200" symbol="critical" width={15} />
        )}
        {trip.crowded_sections > 0 && (
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
