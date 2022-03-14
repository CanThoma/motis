import React, { useRef, useEffect } from "react";
import { select as d3Select } from "d3";
import { colorSchema, peakSpottingConfig as config } from "../../config";

const HorizontalTripDisplayTitle = ({ width, title }) => {
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
          //.attr("dx", 12)
          .attr("y", 8)
          .attr("dy", 8)
          .attr("fill", colorSchema.grey)
          .attr("text-anchor", "middle")
          .attr("font-size", 15)
          .attr("font-weight", "bold")
          .attr("font-family", config.font_family)
          .text(i + ":00");
      }
    }
  }, []);

  return (
    <>
      <div
        style={{
          backgroundColor: colorSchema.lightGrey,
          //borderBottom: "2px solid",
          color: colorSchema.darkBluishGrey,
          width: width,
          height: "50px",
          fontFamily: config.font_family,
          /*
        marginBottom: "5px",
        //width: "100%",
        display: "flex",
        boxShadow: "1px 3px 5px rgba(0, 0, 0, 0.2)",
        WebkitBoxShadow: "1px 3px 5px rgba(0, 0, 0, 0.2)",
        MozBoxShadow: "1px 3px 5px rgba(0, 0, 0, 0.2)",
        */
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
          //width: "100%",
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
