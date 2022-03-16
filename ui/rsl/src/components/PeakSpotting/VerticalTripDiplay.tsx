import React, { useEffect, useRef, useState } from "react";
import { select as d3Select } from "d3";
import {
  colorSchema,
  font_family,
  peakSpottingConfig,
  peakSpottingConfig as config,
  stationConfig,
} from "../../config";
import { prepareTimeEdges } from "./VerticalTripDisplayUtils";
import {
  PaxMonEdgeLoadInfo,
  PaxMonFilteredTripInfo,
} from "../../api/protocol/motis/paxmon";
import { useSankeyContext } from "../context/SankeyContext";

import "./VerticalTripDisplay.css";
import WarningSymbol from "./TripDisplaySymbols";
import { renderTimeDisplay } from "../Sankey/SankeyUtils";
import TrainTable from "./TrainTable";

type Props = {
  width: number;
  trip: PaxMonFilteredTripInfo;
  onStationSelected?: () => void | undefined;
};

/**
 * Gibt eine vertikale Darstellung einer Strecke mit einem Optionsfenster zurück.
 * @param width Wie viel Platz steht zur Verfügung?
 * @param trip Der darzustellende Trip.
 * @constructor
 */
const VerticalTripDisplay = ({
  trip,
  onStationSelected,
}: Props): JSX.Element => {
  const svgRef = useRef(null);
  const [height, setHeight] = useState(500);

  const xTimelineOffset = 50;
  // Breite des grauen Zeitstrahls auf der linken Seite
  const timelineWidth = 2;
  // Radius der Stationen (Darsgestellt durch Kreise) auf dem Zeitstrahl
  const timelineStationRadius = 4;
  // Die weiße Umrandung um die einzelnen Stationen.
  const timelineStationStrokeWidth = timelineWidth;

  // Wie weit der Text von den einzelnen Stationen der Timeline entfernt ist
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

  const { setSelectedStation, setStationName, setEndTime, setStartTime } =
    useSankeyContext();

  /**
   * @returns boolean ob die Signalanzeige gerendert werden soll oder nicht.
   */
  const showSignals = (): boolean => {
    return (
      trip.max_excess_pax > 0 ||
      trip.critical_sections > 0 ||
      trip.crowded_sections > 0
    );
  };

  /**
   * Wird aufgerufen wenn man auf einen Stationsnamen im VerticalTripDisplay drückt. Ruft den Stationsgraphen zur ausgewählten Station auf.
   * @param onStationSelected
   * @param edge
   * @param lastStationFlag
   */
  const handleStationSelect = (
    onStationSelected: (() => void) | undefined,
    edge: PaxMonEdgeLoadInfo,
    lastStationFlag = false
  ): void => {
    if (setSelectedStation) setSelectedStation(edge.from.id);

    let startTime;
    let endTime;
    console.log(edge);
    if (!lastStationFlag) {
      startTime =
        (edge.departure_current_time -
          stationConfig.minutesBeforeTimeSearch * 60) *
        1000;
      endTime =
        (edge.departure_current_time +
          stationConfig.minutesAfterTimeSearch * 60) *
        1000;
      if (setStationName)
        setStationName(
          `${edge.from.name} - ${renderTimeDisplay(startTime / 1000)} Uhr`
        );
    } else {
      startTime =
        (edge.arrival_current_time -
          stationConfig.minutesBeforeTimeSearch * 60) *
        1000;
      endTime =
        (edge.arrival_current_time +
          stationConfig.minutesAfterTimeSearch * 60) *
        1000;
      if (setStationName)
        setStationName(
          `${edge.to.name} - ${renderTimeDisplay(startTime / 1000)} Uhr`
        );
    }

    if (setStartTime) setStartTime(new Date(startTime));
    if (setEndTime) setEndTime(new Date(endTime));

    if (onStationSelected) onStationSelected();
  };

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
        const station = view
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
          .attr("font-family", font_family)
          .attr("cursor", "pointer")
          .on("click", () => handleStationSelect(onStationSelected, edge));
        station.append("title").text("Zur Station");
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
        .text(
          Math.round(
            leftValue * config.temporaryLeftSideScalarBecauseNoProbabilityData
          )
        )
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
            ((leftValue *
              config.temporaryLeftSideScalarBecauseNoProbabilityData) /
              edge.capacity) *
              100
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

      const appendPrognoseNumberText = (
        type: "absolute" | "percent",
        fontSize: number
      ) => {
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
          .text(
            type === "absolute"
              ? rightValue
              : `${Math.round((rightValue / edge.capacity) * 100)}%`
          )
          .attr("dx", graphNumberXOffset)
          .attr("dy", graphLargeNumberYOffset)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "start")
          .attr("font-size", fontSize)
          .attr("font-weight", "inherit")
          .attr("font-family", font_family);
      };
      // "Prognosen" absolute Zahl
      appendPrognoseNumberText("absolute", fontSizeM);

      // "Prognose" Prozent
      appendPrognoseNumberText("percent", fontSizeS);
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
    const from = view
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
      .attr("font-family", font_family)
      .attr("cursor", "pointer")
      .on("click", () => handleStationSelect(onStationSelected, data[0]));

    from.append("title").text("Zur Station");

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
    const to = view
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

    to.append("title").text("Zur Station");

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
      .attr("font-family", font_family)
      .attr("cursor", "pointer")
      .on("click", () =>
        handleStationSelect(onStationSelected, data[data.length - 1], true)
      )
      .append("title")
      .text("Zur Station");

    setHeight(svgHeight + svgPadding);
  }, [
    trip,
    graphLargeNumberYOffset,
    timelineArrivalYOffset,
    timelineStationStrokeWidth,
    handleStationSelect,
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
                  (2 / 3) +
                4
              : 500,
          }}
        >
          <TrainTable trip={trip} />
        </div>
        {/* Signlaeanzeige */}
        {showSignals() && (
          <>
            <div className="h-[50px] flex-initial">
              <h2 className="m-auto mt-2 ml-2 text-xl text-db-cool-gray-600">
                Signale
              </h2>
            </div>
            <div
              className="tableContainer flex-initial overflow-y-scroll hide-scrollbar"
              style={{
                maxHeight: containerRef.current
                  ? (containerRef.current.getBoundingClientRect().height -
                      110) *
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
                          width={peakSpottingConfig.warningSymbolSize}
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
                          width={peakSpottingConfig.warningSymbolSize}
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
                          width={peakSpottingConfig.warningSymbolSize}
                          disableTooltip
                        />
                      </th>
                      <td>Der Zug enthält überfüllte Abschnitte.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerticalTripDisplay;
