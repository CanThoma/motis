import React, { useEffect, useRef, useState } from "react";
import { select as d3Select } from "d3";
import {
  colorSchema,
  font_family,
  peakSpottingConfig as config,
} from "../../config";
import { prepareTimeEdges } from "./VerticalTripDisplayUtils";
import {
  PaxMonEdgeLoadInfo,
  PaxMonFilteredTripInfo,
} from "../../api/protocol/motis/paxmon";

import "./VerticalTripDisplay.css";
import WarningSymbol from "./HorizontalTripDisplaySymbols";

type Props = {
  width: number;
  trip: PaxMonFilteredTripInfo;
};

/**
 * Konvertiert eine Zeitzahl in Epoch/Unix-Time in die Form hh:mm
 * @param t Zeit in epoch-time
 * @returns Die Zeit im Textformat
 */
const renderTimeDisplay = (t: number): string => {
  const dt = new Date(t * 1000);
  const h = dt.getHours();
  const m = dt.getMinutes();
  const hh = h < 10 ? "0" + h : h;
  const mm = m < 10 ? "0" + m : m;

  return hh + ":" + mm;
};

/**
 * Reduziert ein Array aus Edges auf die darin vorkommenden Kapazitäten
 * @param edges Ein Array aus Edges
 * @returns Einen String aller einzigartigen Kapazitäten im Edges-Array
 */
const findCapacities = (edges: PaxMonEdgeLoadInfo[]): string => {
  const uniqueCapacities = edges.map((e) => {
    return e.capacity;
  });

  return uniqueCapacities.filter((v, i, a) => a.indexOf(v) === i).toString();
};

/**
 * Gibt eine vertikale Darstellung einer Strecke mit einem Optionsfenster zurück.
 * @param width Wie viel Platz steht zur Verfügung?
 * @param trip Der darzustellende Trip.
 * @constructor
 */
const VerticalTripDisplay = ({ trip }: Props): JSX.Element => {
  const svgRef = useRef(null);
  const [height, setHeight] = useState(500);

  const xTimelineOffset = 50;
  // Breite des grauen Zeitstrahls auf der linken Seite
  const timelineWidth = 2;
  // Radius der Stationen (Darsgestellt durch Kreise) auf dem Zeitstrahl
  const timelineStationRadius = 4;
  // Die weiße Umrandung um die einzelnen Stationen.
  const timelineStationStrokeWidth = timelineWidth;

  // Wie weit der Text von den einzelnen Stationen der Timeline entfernt?
  const timelineTextXOffset = 10;
  // Höhenverschiebung der Zeitangaben an den Stationen der Timeline
  const timelineStationNameOffset = 2;
  const timelineArrivalYOffset = -5;
  const timelineDepartureYOffset = 8;

  const fontSizeS = 10;
  const fontSizeM = 12;

  const xGraphOffet = 300;
  const graphNumberXOffset = 10;
  const graphLargeNumberYOffset = -3;
  const graphPercentageYOffset = 12;

  const spaceBetweenLeftAndRight = 2.5;

  const titleYOffset = 10;
  const titleXOffset = 10;

  const svgPadding = 30;
  const svgWidth = 580;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let svgHeight = 0;
    const svg = d3Select(svgRef.current);
    svg.selectAll("*").remove();
    const view = svg.append("g").classed("view", true);

    const data = prepareTimeEdges(trip);

    for (let i = 0; i < data.length; i++) {
      const edge = data[i];
      svgHeight += (edge.height || 0) + config.verticalBallPadding;

      const leftValue = edge.passenger_cdf[0].passengers;
      const rightValue = edge.expected_passengers;

      view
        .append("rect")
        .attr("x", xTimelineOffset)
        .attr("y", edge.y || 0)
        .attr("height", edge.height || 0)
        .attr("width", timelineWidth)
        .attr("fill", colorSchema.lighterGrey);

      view
        .append("circle")
        .attr("r", timelineStationRadius)
        .attr("cx", xTimelineOffset + timelineWidth / 2)
        .attr("cy", (edge.y || 0) - timelineStationRadius / 2)
        .attr("stroke", colorSchema.white)
        .attr("stroke-width", timelineStationStrokeWidth)
        .attr("fill", colorSchema.bluishGrey);

      if (i > 0) {
        // STATIONSNAMEN
        view
          .append("text")
          .attr("x", xTimelineOffset)
          .attr("y", edge.y || 0)
          .text(edge.from.name)
          .attr("dx", timelineTextXOffset)
          .attr("dy", timelineStationNameOffset)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "start")
          .attr("font-size", fontSizeM)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);

        // ANKUNFTSZEITEN
        view
          .append("text")
          .attr("x", xTimelineOffset)
          .attr("y", edge.y || 0)
          .text(renderTimeDisplay(data[i - 1].arrival_current_time))
          .attr("dx", -timelineTextXOffset)
          .attr("dy", timelineArrivalYOffset)
          .attr("fill", colorSchema.bluishGrey)
          .attr("text-anchor", "end")
          .attr("font-size", fontSizeS)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);

        // ABFAHRTSZEITEN
        view
          .append("text")
          .attr("x", xTimelineOffset)
          .attr("y", edge.y || 0)
          .text(renderTimeDisplay(edge.departure_current_time))
          .attr("dx", -timelineTextXOffset)
          .attr("dy", timelineDepartureYOffset)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "end")
          .attr("font-size", fontSizeS)
          .attr("font-weight", "bold")
          .attr("font-family", font_family);
      }

      // "BUCHUNGEN"
      view
        .append("rect")
        .attr("x", xGraphOffet)
        .attr("y", edge.y || 0)
        .attr("height", edge.height || 0)
        .attr("width", edge.capWidth || 0)
        .attr("fill", colorSchema.lighterGrey);
      view
        .append("rect")
        .attr("x", xGraphOffet + ((edge.capWidth || 0) - (edge.leftWidth || 0)))
        .attr("y", edge.y || 0)
        .attr("height", edge.height || 0)
        .attr("width", edge.leftWidth || 0)
        .attr("fill", colorSchema.darkGrey);

      // Linke Seite "Buchungen" große/absolute Zahl
      view
        .append("text")
        .attr(
          "x",
          xGraphOffet -
            Math.max(0, (edge.leftWidth || 0) - (edge.capWidth || 0))
        )
        .attr("y", (edge.y || 0) + (edge.height || 0) / 2)
        .text(Math.round(leftValue * config.testMultiplier))
        .attr("dx", -graphNumberXOffset)
        .attr("dy", graphLargeNumberYOffset)
        .attr("fill", colorSchema.grey)
        .attr("text-anchor", "end")
        .attr("font-size", fontSizeM)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);

      // Linke Seite "Buchungen" Prozente
      view
        .append("text")
        .attr(
          "x",
          xGraphOffet -
            Math.max(0, (edge.leftWidth || 0) - (edge.capWidth || 0))
        )
        .attr("y", (edge.y || 0) + (edge.height || 0) / 2)
        .text(
          `${Math.round(
            ((leftValue * config.testMultiplier) / edge.capacity) * 100
          )}%`
        )
        .attr("dx", -graphNumberXOffset)
        .attr("dy", graphPercentageYOffset)
        .attr("fill", colorSchema.bluishGrey)
        .attr("text-anchor", "end")
        .attr("font-size", fontSizeS)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);

      // "PROGNOSEN"
      view
        .append("rect")
        .attr(
          "x",
          xGraphOffet + (edge.capWidth || 0) + spaceBetweenLeftAndRight
        )
        .attr("y", edge.y || 0)
        .attr("height", edge.height || 0)
        .attr("width", edge.capWidth || 0)
        .attr("fill", colorSchema.lighterGrey);
      view
        .append("rect")
        .attr(
          "x",
          xGraphOffet + (edge.capWidth || 0) + spaceBetweenLeftAndRight
        )
        .attr("y", edge.y || 0)
        .attr("height", edge.height || 0)
        .attr("width", edge.rightWidth || 0)
        .attr("fill", edge.color || 0);

      // "Prognosen" absolute Zahl
      view
        .append("text")
        .attr(
          "x",
          xGraphOffet +
            (edge.capWidth || 0) +
            spaceBetweenLeftAndRight +
            Math.max(edge.capWidth || 0, edge.rightWidth || 0)
        )
        .attr("y", (edge.y || 0) + (edge.height || 0) / 2)
        .text(rightValue)
        .attr("dx", graphNumberXOffset)
        .attr("dy", graphLargeNumberYOffset)
        .attr("fill", colorSchema.grey)
        .attr("text-anchor", "start")
        .attr("font-size", fontSizeM)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);

      // "Prognose" Prozent
      view
        .append("text")
        .attr(
          "x",
          xGraphOffet +
            (edge.capWidth || 0) +
            spaceBetweenLeftAndRight +
            Math.max(edge.capWidth || 0, edge.rightWidth || 0)
        )
        .attr("y", (edge.y || 0) + (edge.height || 0) / 2)
        .text(`${Math.round((rightValue / edge.capacity) * 100)}%`)
        .attr("dx", graphNumberXOffset)
        .attr("dy", graphPercentageYOffset)
        .attr("fill", colorSchema.bluishGrey)
        .attr("text-anchor", "start")
        .attr("font-size", fontSizeS)
        .attr("font-weight", "inherit")
        .attr("font-family", font_family);
    }

    //"BUCHUNGEN" TITEL
    view
      .append("text")
      .attr("x", xGraphOffet + (data[0].capWidth || 0))
      .attr("y", titleYOffset)
      .text("Buchungen")
      .attr("dx", -titleXOffset)
      .attr("fill", colorSchema.grey)
      .attr("text-anchor", "end")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);
    //"PROGNOSEN" TITEL
    view
      .append("text")
      .attr(
        "x",
        xGraphOffet + (data[0].capWidth || 0) + spaceBetweenLeftAndRight
      )
      .attr("y", titleYOffset)
      .text("Prognose")
      .attr("dx", titleXOffset)
      .attr("fill", colorSchema.grey)
      .attr("text-anchor", "start")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);

    // ANFANGSSTATION ANKUNFTSZEIT
    view
      .append("text")
      .attr("x", xTimelineOffset)
      .attr("y", data[0].y || 0)
      .text(renderTimeDisplay(data[0].departure_current_time))
      .attr("dx", -timelineTextXOffset)
      .attr("dy", timelineStationNameOffset)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "end")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    // ANFANGSSTATION Name
    view
      .append("text")
      .attr("x", xTimelineOffset)
      .attr("y", data[0].y || 0)
      .text(data[0].from.name)
      .attr("dx", timelineTextXOffset)
      .attr("dy", timelineStationNameOffset)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "start")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);

    // ENDSTATION
    view
      .append("circle")
      .attr("r", timelineStationRadius)
      .attr("cx", xTimelineOffset + timelineWidth / 2)
      .attr(
        "cy",
        (data[data.length - 1].y || 0) +
          (data[data.length - 1].height || 0) -
          timelineStationRadius / 2
      )
      .attr("stroke", colorSchema.white)
      .attr("stroke-width", timelineStationStrokeWidth)
      .attr("fill", colorSchema.bluishGrey);

    // ENDSTATION ANKUNFTSZEIT
    view
      .append("text")
      .attr("x", xTimelineOffset)
      .attr(
        "y",
        (data[data.length - 1].y || 0) + (data[data.length - 1].height || 0)
      )
      .text(renderTimeDisplay(data[data.length - 1].arrival_current_time))
      .attr("dx", -timelineTextXOffset)
      .attr("dy", timelineStationNameOffset)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "end")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "inherit")
      .attr("font-family", font_family);

    // ENDSTATION Name
    view
      .append("text")
      .attr("x", xTimelineOffset)
      .attr(
        "y",
        (data[data.length - 1].y || 0) + (data[data.length - 1].height || 0)
      )
      .text(data[data.length - 1].to.name)
      .attr("dx", timelineTextXOffset)
      .attr("dy", timelineStationNameOffset)
      .attr("fill", colorSchema.black)
      .attr("text-anchor", "start")
      .attr("font-size", fontSizeM)
      .attr("font-weight", "bold")
      .attr("font-family", font_family);

    setHeight(svgHeight + svgPadding);
  }, [
    trip,
    graphLargeNumberYOffset,
    timelineArrivalYOffset,
    timelineStationStrokeWidth,
  ]);

  return (
    /*body*/
    <div
      className="flex flex-row overflow-hidden p-1 h-full "
      style={{
        backgroundColor: colorSchema.lightGrey,
      }}
    >
      {/* Prognose */}
      <div className="flex-auto flex flex-col mx-1 h-full" ref={containerRef}>
        <div className="h-[50px] flex-initial align-middle">
          <h2 className="m-auto mt-2 ml-2 text-xl text-db-cool-gray-600">
            Prognose
          </h2>
        </div>
        <div
          className={`flex-initial overflow-y-scroll p-1 py-3 border-2 border-db-cool-gray-200 hide-scrollbar`}
          style={{
            maxHeight: containerRef.current
              ? containerRef.current.getBoundingClientRect().height - 55
              : 500,
            backgroundColor: colorSchema.white,
          }}
        >
          <svg
            ref={svgRef}
            width={svgWidth}
            height={height}
            className="m-auto"
          />
        </div>
      </div>
      {/* Info etc*/}
      <div className="flex-initial flex flex-col mx-1 h-full">
        {/* Info */}
        <div className="h-[50px] flex-initial">
          <h2 className="m-auto mt-2 ml-2 text-xl text-db-cool-gray-600">
            Infos
          </h2>
        </div>
        <div
          className="tableContainer flex-initial overflow-y-scroll overflow-x-hidden hide-scrollbar"
          style={{
            maxHeight: containerRef.current
              ? (containerRef.current.getBoundingClientRect().height - 110) *
                (2 / 3)
              : 500,
          }}
        >
          <table className="table">
            <tbody>
              <tr>
                <th>ZugNr</th>
                <td>{trip.tsi.trip.train_nr}</td>
              </tr>
              <tr>
                <th>Von</th>
                <td>{`${renderTimeDisplay(trip.tsi.trip.time)} ${
                  trip.tsi.primary_station.name
                }`}</td>
              </tr>
              <tr>
                <th>Bis</th>
                <td>{`${renderTimeDisplay(trip.tsi.trip.target_time)} ${
                  trip.tsi.secondary_station.name
                }`}</td>
              </tr>
              <tr>
                <th>Name</th>
                <td>{trip.tsi.service_infos[0].name}</td>
              </tr>
              <tr>
                <th>Kategorie</th>
                <td>{trip.tsi.service_infos[0].category}</td>
              </tr>
              <tr>
                <th>Zuchnummer</th>
                <td>{trip.tsi.service_infos[0].train_nr}</td>
              </tr>
              <tr>
                <th>Linie</th>
                <td>{trip.tsi.service_infos[0].line}</td>
              </tr>
              <tr>
                <th>Anbieter</th>
                <td>{trip.tsi.service_infos[0].provider}</td>
              </tr>
              <tr>
                <th>Kapazität</th>
                <td>{findCapacities(trip.edges)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Signlaeanzeige */}
        <div className="h-[50px] flex-initial">
          <h2 className="m-auto mt-2 ml-2 text-xl text-db-cool-gray-600">
            Signale
          </h2>
        </div>
        <div
          className="tableContainer flex-initial overflow-y-scroll hide-scrollbar"
          style={{
            maxHeight: containerRef.current
              ? (containerRef.current.getBoundingClientRect().height - 110) *
                (1 / 3)
              : 500,
          }}
        >
          <table className="table">
            <tbody>
              {trip.max_excess_pax > 0 && (
                <tr>
                  <th>
                    <WarningSymbol
                      color="#ef1d18"
                      disableTooltip
                      symbol="excess"
                      width={15}
                    />
                  </th>
                  <td>Der Zug ist überfüllt.</td>
                </tr>
              )}
              {trip.critical_sections > 0 && (
                <tr>
                  <th>
                    <WarningSymbol
                      color="#ff8200"
                      symbol="critical"
                      width={15}
                      disableTooltip
                    />
                  </th>
                  <td>Der Zug enthält kritische Abschnitte.</td>
                </tr>
              )}
              {trip.crowded_sections > 0 && (
                <tr>
                  <th>
                    <WarningSymbol
                      color="#444444"
                      symbol="crowded"
                      width={15}
                      disableTooltip
                    />
                  </th>
                  <td>Der Zug enthält überfüllte Abschnitte.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VerticalTripDisplay;
