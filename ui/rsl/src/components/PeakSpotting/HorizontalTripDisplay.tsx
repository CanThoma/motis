import React, { useRef, useEffect, useState } from "react";
import { select as d3Select } from "d3";
import { colorSchema, peakSpottingConfig as config } from "../../config";

import { prepareEdges, formatEdgeInfo } from "./HorizontalTripDisplayUtils";
import WarningSymbol from "./HorizontalTripDisplaySymbols";

const HorizontalTripDisplay = ({
  tripData,
  width,
  selectedTrip,
  height = 80,
}) => {
  const svgRef = useRef(null);
  const [overflow, setOverflow] = useState(false);

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
        .attr("y", edge.y) // height - edge.maxPax / config.horizontalCapacityScale)
        .attr("height", edge.height)
        .attr("width", edge.width)
        .attr("fill", edge.colour);

      tom.append("title").text(formatEdgeInfo(edge));
      tim
        .append("title")
        .text(
          `${edge.from.name} \u279E ${edge.to.name}\n${edge.maxPax} maxPax?-Leutchen`
        );
    }

    console.log(data);
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

    console.log(selectedTrip);
    console.log(tripData.tsi.trip.train_nr);
    console.log(tripData.tsi);
    console.log(selectedTrip === tripData.tsi.trip.station_id);
  }, []);
  return (
    <div
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
      }}
      //className="tripRow grid grid-flow-col"
      className={
        selectedTrip === tripData.tsi.trip.train_nr
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
          <WarningSymbol color="#ef1d18" symbol="circle" width={15} />
        )}
        {false && (
          <WarningSymbol color="#ff8200" symbol="triangle" width={15} />
        )}
        {false && <WarningSymbol color="#444444" symbol="bomb" width={15} />}
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
