import React, { MouseEvent, useRef, useState } from "react";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey
import { Node, Link } from "../StationGraph/SankeyStationTypes";
import { createGraph, formatTextNode } from "./SankeyUmsteigerUtils";
import { sameId, formatTextLink, createSankeyLink } from "../SankeyUtils";
import { TripId } from "../../../api/protocol/motis";
import { ExtractStationData } from "../../StationInfoUtils";
import * as d3 from "d3";
import { formatTextTime } from "../SankeyUtils";

type Props = {
  stationId: string;
  currentArrivalTime: number;
  currentDepartureTime: number;
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
  currentArrivalTime,
  currentDepartureTime,
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

  const linkOpacity = 0.4;
  const linkOpacityFocus = 0.7;
  const linkOpacityClear = 0.05;

  const nodeOpacity = 0.9;
  const rowBackgroundColour = "#cacaca";
  const backdropOpacity = 0.7;

  const data = ExtractStationData({
    stationId: stationId,
    startTime: currentArrivalTime - 2 * 60 * 60, // 2 Stunden vor Ankunft
    endTime: currentDepartureTime + 2 * 60 * 60, // 2 Stunden nach Abfahrt
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
      width,
      nodeWidth,
      nodePadding,
      factor: 10,
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
      .attr("fill", rowBackgroundColour)
      .attr("opacity", backdropOpacity);

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
      .attr("fill", (d) => d.color || rowBackgroundColour)
      .attr("opacity", nodeOpacity);

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
          rowBackgroundColour
      )
      .attr("opacity", nodeOpacity);

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
          rowBackgroundColour
      )
      .attr("opacity", nodeOpacity)
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
        createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0)
      )
      .attr("stroke", (d) => d.color || rowBackgroundColour)
      .attr("stroke-opacity", linkOpacity)
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
      .attr("x", 20)
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
      .attr("x", width - 20)
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

    // der erste Parameter ist das Event, wird hier allerdings nicht gebraucht.
    // eigentlich ist der Import von dem Interface auch unnötig, aber nun ja...

    function branchAnimate(_: MouseEvent, node: Node) {
      const focusLinks = view.selectAll("path.link").filter((l) => {
        return (
          sameId((l as Link).tNId, node.id) || sameId((l as Link).fNId, node.id)
        );
      });
      focusLinks.attr("stroke-opacity", linkOpacityFocus);

      const clearLinks = view.selectAll("path.link").filter((l) => {
        return (
          !sameId((l as Link).tNId, node.id) &&
          !sameId((l as Link).fNId, node.id)
        );
      });
      clearLinks.attr("stroke-opacity", linkOpacityClear);
    }

    function branchClear() {
      links.attr("stroke-opacity", linkOpacity);
    }

    backdrop.on("mouseover", branchAnimate);
    backdrop.on("mouseout", branchClear);
    nodes.on("mouseover", branchAnimate);
    nodes.on("mouseout", branchClear);
    overflow.on("mouseover", branchAnimate);
    overflow.on("mouseout", branchClear);

    function linkAnimate(_: MouseEvent, link: Link) {
      const focusLinks = view.selectAll("path.link").filter((l) => {
        return (l as Link).id === link.id;
      });
      focusLinks.attr("stroke-opacity", linkOpacityFocus);

      const clearLinks = view.selectAll("path.link").filter((l) => {
        return (l as Link).id !== link.id;
      });
      clearLinks.attr("stroke-opacity", linkOpacityClear);
    }

    function linkClear() {
      links.attr("stroke-opacity", linkOpacity);
    }

    links.on("mouseover", linkAnimate).on("mouseout", linkClear);
  }, [
    data,
    height,
    width,
    nodeWidth,
    nodePadding,
    duration,
    svgHeightUmsteiger,
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
          style={{ marginBottom: "1.45rem" }} // TODO: das ist nur testweise wegen der besseren Lesbarkeit.
        />
      )}
    </>
  );
};

export default SankeyUmsteigerGraph;
