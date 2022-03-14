import React, { useRef, useState } from "react";
import { createGraph, formatTextNode } from "./SankeyUmsteigerUtils";
import {
  sameId,
  formatTextLink,
  createSankeyLink,
  nodeFocus,
  linksClear,
  linkFocus,
} from "../SankeyUtils";
import { TripId } from "../../../api/protocol/motis";
import { ExtractStationData } from "../../StationInfoUtils";
import * as d3 from "d3";
import { formatTextTime } from "../SankeyUtils";
import { umsteigerConfig } from "../../../config";

type Props = {
  stationId: string;
  time: number;
  onlyIncludeTripId: TripId[];
  tripDir: "entering" | "exiting" | "both";
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};

const SankeyUmsteigerGraph = ({
  stationId,
  time,
  onlyIncludeTripId,
  tripDir,
  width = 600,
  height = 600,
  nodeWidth = 25,
  nodePadding = 15,
  duration = 250,
}: Props): JSX.Element => {
  const svgRef = useRef(null);
  const [svgHeightUmsteiger, setSvgHeight] = useState(600);

  const data = ExtractStationData({
    stationId: stationId,
    startTime: time - 2.5 * 60 * 60, // 2 Stunden vor Ankunft
    endTime: time + 2.5 * 60 * 60, // 2 Stunden nach Abfahrt
    maxCount: 0,
    onlyIncludeTripIds: [...onlyIncludeTripId],
    tripDirection: tripDir,
  });

  React.useEffect(() => {
    const handleSvgResize = (newSize: number) => {
      setSvgHeight(newSize);
    };

    const graph = createGraph({
      fNodes: data.fromNodes,
      tNodes: data.toNodes,
      links: data.links,
      onSvgResize: handleSvgResize,
      nodeWidth,
      nodePadding,
      tripDir,
    });
    const graphTemp = {
      nodes: [...graph.toNodes, ...graph.fromNodes],
      links: graph.links,
    };

    const svg = d3.select(svgRef.current);
    // Säubern von potentiellen svg Inhalt
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    const hatchPattern = defs
      .append("pattern")
      .attr("id", "diagonalHash")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", "10")
      .attr("height", "10")
      .attr("patternTransform", "rotate(45)")
      .append("g")
      .style("stroke", "#f01414")
      .style("stroke-width", 5);

    hatchPattern
      .append("line")
      .attr("x1", 5)
      .attr("y", 0)
      .attr("x2", 5)
      .attr("y2", 10);

    // Animation der Strichfarbe
    hatchPattern
      .append("animate")
      .attr("attributeName", "stroke")
      .attr("dur", "5s")
      .attr("repeatCount", "indefinite")
      .attr("keyTimes", "0;0.5;1")
      .attr("values", "#ECE81A;#f01414;#ECE81A;");

    // Add a g.view for holding the sankey diagram.
    const view = svg.append("g").classed("view", true);

    // Define the BACKDROPS – Die grauen Balken hinter den nicht "vollen" Haltestellen.
    const backdrop = view
      .selectAll("rect.nodeBackdrop")
      .data(graphTemp.nodes.filter((n) => n.pax !== 0)) // filter out empty nodes
      .join("rect")
      .classed("backdrop", true)
      .attr("id", (d) => d.id + "_backdrop")
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0_backdrop || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) =>
        Math.max(0, (d.y1_backdrop || 0) - (d.y0_backdrop || 0))
      )
      .attr("fill", umsteigerConfig.rowBackgroundColor)
      .attr("opacity", umsteigerConfig.backdropOpacity);

    // Define the nodes.
    const nodes = view
      .selectAll("rect.node")
      .data(graphTemp.nodes)
      .join("rect")
      .classed("node", true)
      .attr("id", (d) => String(d.id))
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => (d.full ? d.y0_backdrop || 0 : d.y0 || 0))
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) =>
        Math.max(
          0,
          d.full
            ? (d.y1 || 0) - (d.y0_backdrop || 0)
            : (d.y1 || 0) - (d.y0 || 0)
        )
      )
      .attr("fill", (d) => d.color || umsteigerConfig.rowBackgroundColor)
      .attr("opacity", umsteigerConfig.nodeOpacity);

    view
      .selectAll("rect.nodeOverflowBack")
      .data(graphTemp.nodes.filter((n) => n.full))
      .join("rect")
      .classed("nodeOverflowBack", true)
      .attr("id", (n) => String(n.id))
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y0_backdrop || 0) - (d.y0 || 0)))
      .attr(
        "fill",
        (d) =>
          d3.interpolateRgb.gamma(0.8)("red", "orange")(d.cap / d.pax) ||
          umsteigerConfig.rowBackgroundColor
      )
      .attr("opacity", umsteigerConfig.nodeOpacity);

    //Define the Overflow
    const overflow = view
      .selectAll("rect.nodeOverflow")
      .data(graphTemp.nodes.filter((n) => n.full))
      .join("rect")
      .classed("nodeOverflow", true)
      .attr("id", (n) => String(n.id))
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y0_backdrop || 0) - (d.y0 || 0)))
      .attr(
        "fill",
        (d) =>
          d3.interpolateRgb.gamma(0.8)("red", "orange")(d.cap / d.pax) ||
          umsteigerConfig.rowBackgroundColor
      )
      .attr("opacity", umsteigerConfig.nodeOpacity)
      .style("fill", "url(#diagonalHash)");

    // Add titles for node hover effects.
    nodes.append("title").text((d) => formatTextNode(d.name, d));

    // Add titles for backdrop hover effects.
    backdrop.append("title").text((d) => formatTextNode(d.name, d));

    // Add titles for backdrop hover effects.
    overflow.append("title").text((d) => formatTextNode(d.name, d));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graphTemp.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        createSankeyLink(
          nodeWidth,
          width,
          d.y0 || 0,
          d.y1 || 0,
          umsteigerConfig.timeOffset
        )
      )
      .attr("stroke", (d) => d.color || umsteigerConfig.rowBackgroundColor)
      .attr("stroke-opacity", umsteigerConfig.linkOpacity)
      .attr("stroke-width", (d) => d.width || 1)
      .attr("fill", "none");

    // Add text labels for Names
    view
      .selectAll("text.node")
      .data(graphTemp.nodes.filter((n) => n.pax > 0))
      .join("text")
      .classed("node", true)
      .attr("x", (d) => d.x1 || -1)
      .attr("dx", 6)
      .attr(
        "y",
        (d) =>
          (d.y0_backdrop || 0) +
          ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
      )
      .attr("dy", "0.35em")
      .attr("fill", "black")
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-family", "Arial, sans-serif")
      .text((d) => {
        if (typeof d.id === "string") {
          return d.name;
        } else {
          return d.name;
        }
      })

      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", (d) => d.x0 || 0)
      .attr("dx", -6)
      .attr("text-anchor", "end");

    // Add text labels for time.
    view
      .selectAll("text.nodeTime")
      .data(graphTemp.nodes.filter((n) => n.pax > 0))
      .join("text")
      .classed("node", true)
      .attr("x", 0)
      .attr("dx", 0)
      .attr(
        "y",
        (d) =>
          (d.y0_backdrop || 0) +
          ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
      )
      .attr("dy", "0.35em")
      .attr("fill", "black")
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-family", "Arial, sans-serif")
      .text((d) => {
        if (typeof d.id === "string") {
          return "";
        } else {
          return formatTextTime(d);
        }
      })
      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", width)
      .attr("dx", 0)
      .attr("text-anchor", "end");

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.fromNodes.find((n) =>
        sameId(n.id, d.fNId)
      )?.name;
      const targetName = graph.toNodes.find((n) => sameId(n.id, d.tNId))?.name;
      return formatTextLink(sourceName || " – ", targetName || " – ", d);
    });

    backdrop.on("mouseover", (_, n) => {
      nodeFocus(_, n, view);
    });
    backdrop.on("mouseout", () => linksClear(links));
    nodes.on("mouseover", (_, n) => {
      nodeFocus(_, n, view);
    });
    nodes.on("mouseout", () => linksClear(links));
    overflow.on("mouseover", (_, n) => {
      nodeFocus(_, n, view);
    });
    overflow.on("mouseout", () => linksClear(links));

    links
      .on("mouseover", (_, l) => linkFocus(_, l, view))
      .on("mouseout", () => linksClear(links));
  }, [
    data,
    height,
    width,
    nodeWidth,
    nodePadding,
    duration,
    svgHeightUmsteiger,
    tripDir,
  ]);

  return (
    <>
      {!data && <div>Daten zum Zug nicht verfügbar</div>}
      {!data.links.length && tripDir === "both" && (
        <div>Keine Umsteiger gefunden</div>
      )}
      {!data.links.length && tripDir !== "both" && (
        <div>Keine Umsteiger in ausgewählter Richtung gefunden</div>
      )}
      {data && (
        <svg
          ref={svgRef}
          width={width}
          height={svgHeightUmsteiger}
          className="m-auto"
          style={{ marginBottom: "1.45rem" }}
        />
      )}
    </>
  );
};

export default SankeyUmsteigerGraph;
