import React, { useEffect, useRef, useState } from "react";
import { select as d3Select } from "d3";
import { colorSchema, font_family } from "../../config";
import { prepareTimeEdges } from "./VerticalTripDisplayUtils";

type Props = {
  width: number;
  trip: any;
};

/**
 * TODO
 * @param width
 * @param trip
 * @constructor
 */
const VerticalTripDisplay = ({ width, trip }: Props): JSX.Element => {
  const svgRef = useRef(null);
  const [height, setHeight] = useState(500);

  useEffect(() => {
    let svgHeight = 0;
    const svg = d3Select(svgRef.current);
    svg.selectAll("*").remove();
    const view = svg.append("g").classed("view", true);

    const data = prepareTimeEdges(trip);

    for (let i = 0; i < data.length; i++) {
      const edge = data[i];
      svgHeight += edge.height;

      view
        .append("rect")
        .attr("x", 50)
        .attr("y", edge.y)
        .attr("height", edge.height)
        .attr("width", 2)
        .attr("fill", colorSchema.lighterGrey);

      view
        .append("circle")
        .attr("r", 4)
        .attr("cx", 51)
        .attr("cy", edge.y - 2)
        .attr("stroke", colorSchema.white)
        .attr("stroke-width", "2")
        .attr("fill", colorSchema.bluishGrey);

      if (i > 0) {
        // STATIONSNAMEN
        view
          .append("text")
          .attr("x", 50)
          .attr("y", edge.y)
          .text(edge.from.name)
          .attr("dx", 10)
          .attr("dy", 2)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "start")
          .attr("font-size", 12)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);

        // ANKUNFTSZEITEN
        view
          .append("text")
          .attr("x", 50)
          .attr("y", edge.y)
          .text(
            `${data[i - 1].arrivalHours}:${
              data[i - 1].arrivalMinutes < 10
                ? "0" + data[i - 1].arrivalMinutes
                : data[i - 1].arrivalMinutes
            }`
          ) // TODO:in ne Funktion auslagern !
          .attr("dx", -10)
          .attr("dy", -5)
          .attr("fill", colorSchema.bluishGrey)
          .attr("text-anchor", "end")
          .attr("font-size", 10)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);

        // ABFAHRTSZEITEN
        view
          .append("text")
          .attr("x", 50)
          .attr("y", edge.y)
          .text(
            `${edge.departureHours}:${
              edge.departureMinutes < 10
                ? "0" + edge.departureMinutes
                : edge.departureMinutes
            }`
          )
          .attr("dx", -10)
          .attr("dy", 8)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "end")
          .attr("font-size", 10)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);
      }

      // "BUCHUNGEN"
      view
        .append("rect")
        .attr("x", 300)
        .attr("y", edge.y)
        .attr("height", edge.height)
        .attr("width", edge.capWidth)
        .attr("fill", colorSchema.lighterGrey);
      view
        .append("rect")
        .attr("x", 300 + (edge.capWidth - edge.leftWidth))
        .attr("y", edge.y)
        .attr("height", edge.height)
        .attr("width", edge.leftWidth)
        .attr("fill", colorSchema.darkGrey);

      view
        .append("text")
        .attr("x", 300 - Math.max(0, edge.leftWidth - edge.capWidth))
        .attr("y", edge.y + edge.height / 2)
        .text(edge.max_pax)
        .attr("dx", -10)
        .attr("dy", -3)
        .attr("fill", colorSchema.grey)
        .attr("text-anchor", "end")
        .attr("font-size", 12)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);
      view
        .append("text")
        .attr("x", 300 - Math.max(0, edge.leftWidth - edge.capWidth))
        .attr("y", edge.y + edge.height / 2)
        .text(`${Math.round((edge.max_pax / edge.capacity) * 100)}%`)
        .attr("dx", -10)
        .attr("dy", 12)
        .attr("fill", colorSchema.bluishGrey)
        .attr("text-anchor", "end")
        .attr("font-size", 10)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);
      // "PROGNOSEN"
      view
        .append("rect")
        .attr("x", 300 + edge.capWidth + 2.5)
        .attr("y", edge.y)
        .attr("height", edge.height)
        .attr("width", edge.capWidth)
        .attr("fill", colorSchema.lighterGrey);
      view
        .append("rect")
        .attr("x", 300 + edge.capWidth + 2.5)
        .attr("y", edge.y)
        .attr("height", edge.height)
        .attr("width", edge.rightWidth)
        .attr("fill", edge.color);
      view
        .append("text")
        .attr(
          "x",
          300 + edge.capWidth + 2.5 + Math.max(edge.capWidth, edge.rightWidth)
        )
        .attr("y", edge.y + edge.height / 2)
        .text(edge.max_pax)
        .attr("dx", 10)
        .attr("dy", -3)
        .attr("fill", colorSchema.grey)
        .attr("text-anchor", "start")
        .attr("font-size", 12)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);
      view
        .append("text")
        .attr(
          "x",
          300 + edge.capWidth + 2.5 + Math.max(edge.capWidth, edge.rightWidth)
        )
        .attr("y", edge.y + edge.height / 2)
        .text(`${Math.round((edge.max_pax / edge.capacity) * 100)}%`)
        .attr("dx", 10)
        .attr("dy", 12)
        .attr("fill", colorSchema.bluishGrey)
        .attr("text-anchor", "start")
        .attr("font-size", 10)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);
    }

    //"BUCHUNGEN" TITEL
    view
      .append("text")
      .attr("x", 300 + data[0].capWidth)
      .attr("y", 10)
      .text("Buchungen")
      .attr("dx", -10)
      //.attr("dy", 8)
      .attr("fill", colorSchema.grey)
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);
    //"PROGNOSEN" TITEL
    view
      .append("text")
      .attr("x", 300 + data[0].capWidth + 2.5)
      .attr("y", 10)
      .text("Prognose")
      .attr("dx", 10)
      //.attr("dy", 8)
      .attr("fill", colorSchema.grey)
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);

    // ANFANGSSTATION ANKUNFTSZEIT
    view
      .append("text")
      .attr("x", 50)
      .attr("y", data[0].y)
      .text(
        `${data[0].departureHours}:${
          data[0].departureMinutes < 10
            ? "0" + data[0].departureMinutes
            : data[0].departureMinutes
        }`
      )
      .attr("dx", -10)
      .attr("dy", 2)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    // ANFANGSSTATION Name
    view
      .append("text")
      .attr("x", 50)
      .attr("y", data[0].y)
      .text(data[0].from.name)
      .attr("dx", 10)
      .attr("dy", 2)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "start")
      .attr("font-size", 12)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    // ENDSTATION
    view
      .append("circle")
      .attr("r", 4)
      .attr("cx", 51)
      .attr("cy", data[data.length - 1].y + data[data.length - 1].height - 2)
      .attr("stroke", colorSchema.white)
      .attr("stroke-width", "2")
      .attr("fill", colorSchema.bluishGrey);

    // ENDSTATION ANKUNFTSZEIT
    view
      .append("text")
      .attr("x", 50)
      .attr("y", data[data.length - 1].y + data[data.length - 1].height)
      .text(
        `${data[data.length - 1].arrivalHours}:${
          data[data.length - 1].arrivalMinutes
        }`
      )
      .attr("dx", -10)
      .attr("dy", 2)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    // ENDSTATION Name
    view
      .append("text")
      .attr("x", 50)
      .attr("y", data[data.length - 1].y + data[data.length - 1].height)
      .text(data[data.length - 1].to.name)
      .attr("dx", 10)
      .attr("dy", 2)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "start")
      .attr("font-size", 12)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    setHeight(svgHeight + 130);
  }, [trip]);

  return (
    <div style={{ width, backgroundColor: colorSchema.lightGrey }}>
      <div style={{ display: "flex", height: "50px" }}>
        <h2
          style={{
            margin: "auto auto auto 7px",
            color: "rgb(48, 55, 60)",
            fontSize: "20px",
            overflow: "hidden",
          }}
        >
          Prognose
        </h2>
      </div>
      <div className="grid grid-flow-col">
        <div>
          <svg
            ref={svgRef}
            width={580}
            height={height}
            style={{
              backgroundColor: colorSchema.white,
              border: "2px solid #cfd4d9",
              padding: "15px",
              marginLeft: "5px",
            }}
            className="m-auto"
          />
        </div>
        <div>INFOS</div>
      </div>
    </div>
  );
};

export default VerticalTripDisplay;