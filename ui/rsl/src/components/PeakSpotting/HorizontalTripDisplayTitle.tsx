import React, { useRef, useEffect } from "react";
import { select as d3Select } from "d3";
import {
  colorSchema,
  font_family,
  peakSpottingConfig as config,
} from "../../config";

/**
 * Gibt Titelleiste des Horizontalen Peak Spotting graphen zurück
 * @param width breite des Horizontalen Peak Spottings
 * @param title der titel der angezeigt werden soll
 * @constructor
 */
const HorizontalTripDisplayTitle = ({
  width,
  title,
}: {
  width: number;
  title: string;
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
