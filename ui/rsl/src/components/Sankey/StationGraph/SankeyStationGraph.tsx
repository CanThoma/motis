import React, { useRef, useState } from "react";
import * as d3 from "d3";
import { createGraph, formatTextNode } from "./SankeyStationUtils";
import {
  formatTextTime,
  formatTextLink,
  createSankeyLink,
  sameId,
  nodeFocus,
  linksClear,
  linkFocus,
} from "../SankeyUtils";
import { TripId } from "../../../api/protocol/motis";
import { ExtractStationData } from "../../StationInfoUtils";
import { DownloadIcon } from "@heroicons/react/solid";
import Loading from "../../common/Loading";
import { font_family } from "../../../config";
import { stationConfig } from "../../../config";

type Props = {
  stationId: string;
  startTime: number;
  endTime: number;
  onTripSelected: (id: TripId, name: string) => void;
  factor: number;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};

/**
 *
 * @param url
 * @param filename
 */
function downloadBlob(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

/**
 *
 * @param svgEl
 */
function getSvgBlob(svgEl: SVGSVGElement) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);
  const css = document.getElementById("svgStyle")?.outerHTML;
  if (css) {
    source = source.replace("<g", css + "<g");
  }
  return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
}

/**
 *
 * @param svgEl
 * @param baseFileName
 */
function saveAsSVG(svgEl: SVGSVGElement | null, baseFileName: string) {
  if (!svgEl) {
    return;
  }
  const svgBlob = getSvgBlob(svgEl);
  const url = URL.createObjectURL(svgBlob);
  downloadBlob(url, baseFileName + ".svg");
}

/**
 *
 * @param stationId
 * @param startTime
 * @param endTime
 * @param onTripSelected
 * @param factor
 * @param width
 * @param nodeWidth
 * @param nodePadding
 * @constructor
 */
const SankeyStationGraph = ({
  stationId,
  startTime,
  endTime,
  onTripSelected,
  factor,
  nodeWidth = 25,
  nodePadding = 15,
}: Props): JSX.Element => {
  const svgRef = useRef(null);

  const [svgHeight, setSvgHeight] = useState(600);
  //const [loading, setLoading] = useState(false);

  // TODO
  const loadingStatus = useRef(true);

  const data = ExtractStationData({
    stationId: stationId,
    startTime: startTime,
    endTime: endTime,
    maxCount: 0,
    onStatusUpdate: (e) => {
      loadingStatus.current = e !== "success";
    },
    tripDirection: "both",
  });

  React.useEffect(() => {
    loadingStatus.current = true;
    //setLoading(true);
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
      factor,
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
      .attr("fill", stationConfig.rowBackgroundColor)
      .attr("opacity", stationConfig.backdropOpacity)
      .attr("cursor", "pointer")
      .on("click", (_, i) => {
        if (typeof i.id !== "string") onTripSelected(i.id, i.name);
      });

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
      .attr("fill", (d) => d.color || stationConfig.rowBackgroundColor)
      .attr("opacity", stationConfig.nodeOpacity);

    nodes
      .filter((n) => typeof n.id !== "string")
      .attr("cursor", "pointer")
      .on("click", (_, i) => {
        if (typeof i.id !== "string") onTripSelected(i.id, i.name);
      });

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
          stationConfig.rowBackgroundColor
      )
      .attr("opacity", stationConfig.nodeOpacity);

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
          stationConfig.rowBackgroundColor
      )
      .attr("opacity", stationConfig.nodeOpacity)
      .attr("cursor", "pointer")
      .on("click", (_, i) => {
        if (typeof i.id !== "string") onTripSelected(i.id, i.name);
      })
      .style("fill", "url(#diagonalHash)");

    // Add titles for node hover effects.
    nodes.append("title").text((d) => formatTextNode(d));

    // Add titles for backdrop hover effects.
    backdrop.append("title").text((d) => formatTextNode(d));

    // Add titles for backdrop hover effects.
    overflow.append("title").text((d) => formatTextNode(d));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graphTemp.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        createSankeyLink(
          nodeWidth,
          stationConfig.width,
          d.y0 || 0,
          d.y1 || 0,
          stationConfig.timeOffset
        )
      )
      .attr("stroke", (d) => d.color || stationConfig.rowBackgroundColor)
      .attr("stroke-opacity", stationConfig.linkOpacity)
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
      .attr("font-size", 12)
      .attr("font-family", "Arial, sans-serif")
      .text((d) => {
        return d.name;
      })

      .filter((d) => (d.x1 || 0) > stationConfig.width / 2)
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
      .filter((d) => (d.x1 || 0) > stationConfig.width / 2)
      .attr("x", stationConfig.width - 20)
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

    // Add Abfahrt and Ankunft markers

    let tempFHeight;
    const nonEmptyFNodes = graph.fromNodes.filter(
      (n) => n.pax > 0 && typeof n.id !== "string"
    );
    if (nonEmptyFNodes[0] && nonEmptyFNodes[0].y0_backdrop) {
      tempFHeight = Math.max(nonEmptyFNodes[0].y0_backdrop - 10, 8);
    } else {
      tempFHeight = 30;
    }

    view
      .append("text")
      .attr("x", stationConfig.timeOffset)
      .attr("dx", -5) //
      .attr("y", tempFHeight)
      .attr("dy", 2.5)
      .attr("text-anchor", "end")
      .attr("font-family", font_family)
      .attr("font-size", 12)
      .attr("fill", "#a8a8a8")
      .text("ANKUNFT");

    let tempTHeight;
    const nonEmptyTNodes = graph.toNodes.filter((n) => n.pax > 0);
    if (nonEmptyTNodes[0] && nonEmptyTNodes[0].y0_backdrop) {
      tempTHeight = nonEmptyTNodes[0].y0_backdrop - 10;
    } else {
      tempTHeight = 30;
    }

    view
      .append("text")
      .attr("x", stationConfig.width - stationConfig.timeOffset)
      .attr("dx", 5) //
      .attr("y", tempTHeight)
      .attr("text-anchor", "start")
      .attr("font-family", font_family)
      .attr("font-size", 12)
      .attr("fill", "#a8a8a8")
      .text("ABFAHRT");

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

    //setLoading(false);
    links
      .on("mouseover", (_, l) => linkFocus(_, l, view))
      .on("mouseout", () => linksClear(links));
  }, [data, factor, nodeWidth, nodePadding, onTripSelected]);
  loadingStatus.current = false;

  return (
    <>
      {!data && <div>Station nicht vorhanden</div>}
      {data && !data.links.length && !loadingStatus.current && (
        <div>Keine Daten zu diesen Zeiten verfügbar</div>
      )}
      {/* BUG: state is never reached */}
      {loadingStatus.current && data.links.length > 0 && <Loading />}
      {!loadingStatus.current && data.links.length > 0 && (
        <>
          <svg
            ref={svgRef}
            width={stationConfig.width}
            height={svgHeight}
            className="m-auto"
          />
          <div
            className="flex justify-center"
            data-tooltip="Diagramm Download"
            data-tooltip-location="top"
          >
            <button
              className="flex items-center bg-db-red-500 px-3 py-1 rounded text-white text-sm hover:bg-db-red-600"
              onClick={() => saveAsSVG(svgRef.current, "stationgraph")}
            >
              <DownloadIcon className="w-5 h-5 mr-2" aria-hidden="true" />
              SVG
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default SankeyStationGraph;
