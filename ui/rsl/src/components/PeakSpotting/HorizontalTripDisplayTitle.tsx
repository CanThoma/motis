import React, { useRef, useEffect } from "react";
import { select as d3Select } from "d3";
import {
  colorSchema,
  font_family,
  peakSpottingConfig as config,
} from "../../config";
import {
  PaxMonEdgeLoadInfo,
  PaxMonFilteredTripInfo,
} from "../../api/protocol/motis/paxmon";

const formatDate = (time: number) => {
  const date = new Date(time * 1000);
  const d = date.getDay();
  const m = date.getMonth();
  const dd = d < 10 ? "0" + d : d;
  const mm = m < 10 ? "0" + m : m;

  return `${dd}.${mm}.${date.getFullYear()}`;
};

/**
 * Gibt Titelleiste des Horizontalen Peak Spotting graphen zurück
 * @param width breite des Horizontalen Peak Spottings
 * @param title der titel der angezeigt werden soll
 * @param date Abfahrtszeit in unixtime
 * @constructor
 */
const HorizontalTripDisplayTitle = ({
  width,
  title,
  selectedTrip,
}: {
  width: number;
  title: string;
  selectedTrip: PaxMonFilteredTripInfo | undefined;
}): JSX.Element => {
  const svgTitleRef = useRef(null);

  const graphWidth =
    width - (config.horizontalLeftPadding + config.horizontalRightPadding);

  useEffect(() => {
    const titleSvg = d3Select(svgTitleRef.current);
    titleSvg.selectAll("*").remove();
    const titleView = titleSvg.append("g").classed("view", true);

    for (let i = 0; i < config.timeFrame; i++) {
      if (i % 2 == 0 && i > 5) {
        titleView
          .append("text")
          .attr("x", graphWidth * (i / config.timeFrame))
          .attr("y", 8)
          .attr("dy", 8)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "middle")
          .attr("font-size", 15)
          .attr("font-weight", "bold")
          .attr("font-family", font_family)
          .text(i + ":00");
      }
    }
  }, [graphWidth]);

  return (
    <>
      <div
        style={{
          backgroundColor: colorSchema.lightGrey,
          color: colorSchema.darkBluishGrey,
          width: width,
          height: "50px",
          fontFamily: font_family,
        }}
        className="grid grid-flow-col"
      >
        <div
          style={{
            width: `${config.horizontalLeftPadding}px`,
            display: "flex",
            position: "relative",
          }}
        >
          <h2
            style={{
              margin: "auto",
              marginLeft: "7px",
              color: colorSchema.black,
              fontSize: "20px",
              overflow: "hidden",
            }}
          >
            {title}
          </h2>
          <div
            style={{
              position: "absolute",
              alignContent: "center",
              display: "flex",
              height: "50px",
              paddingLeft: `${config.horizontalLeftPadding + 20}px`,
            }}
          >
            {selectedTrip?.tsi.trip.time && (
              <h2
                style={{
                  margin: "auto",
                  marginLeft: "7px",
                  color: colorSchema.grey,
                  fontSize: "15px",
                }}
                data-tooltip={`Das Datum des Zuges ${selectedTrip.tsi.trip.train_nr} - ${selectedTrip.tsi.service_infos[0].name}`}
                data-tooltip-location="right"
              >
                {formatDate(selectedTrip?.tsi.trip.time)}
              </h2>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: "2px",
            marginRight: `${config.horizontalRightPadding}px`,
          }}
        >
          <svg
            ref={svgTitleRef}
            width={graphWidth}
            height={20}
            className="m-auto"
          />
        </div>
      </div>
      <div
        style={{
          marginBottom: "5px",
          backgroundColor: colorSchema.darkBluishGrey,
          width: width,
          height: "2px",
          display: "flex",
          boxShadow: "-2px 2px 4px 0px rgba(0, 0, 0, 0.2)",
          WebkitBoxShadow: "-2px 2px 4px 0px rgba(0, 0, 0, 0.2)",
          MozBoxShadow: "-2px 2px 4px 0px rgba(0, 0, 0, 0.2)",
        }}
      />
    </>
  );
};

export default HorizontalTripDisplayTitle;
