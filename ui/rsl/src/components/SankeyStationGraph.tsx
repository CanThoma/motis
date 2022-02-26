import React, { MouseEvent, useRef, useState } from "react";
import * as d3 from "d3";
// import { select as d3Select, easeLinear } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey

import { Node, Link } from "./SankeyStationTypes";
import Utils from "./SankeyStationUtils";
import { TripId } from "../api/protocol/motis";
import { ExtractStationData } from "./StationInfoUtils";
import { DownloadIcon } from "@heroicons/react/solid";
import Loading from "./common/Loading";

type Props = {
  stationId: string;
  startTime: number;
  endTime: number;
  maxCount: number;
  onTripSelected: (id: TripId | string, name: string) => void;
  factor: number;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};
function downloadBlob(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function getSvgBlob(svgEl: SVGSVGElement) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgEl);
  const css = document.getElementById("svgStyle")?.outerHTML;
  if (css) {
    source = source.replace("<g", css + "<g");
  }
  return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
}

function saveAsSVG(svgEl: SVGSVGElement | null, baseFileName: string) {
  if (!svgEl) {
    console.log(svgEl);
    return;
  }
  const svgBlob = getSvgBlob(svgEl);
  const url = URL.createObjectURL(svgBlob);
  console.log(url);
  downloadBlob(url, baseFileName + ".svg");
}
const SankeyStationGraph = ({
  stationId,
  startTime,
  endTime,
  maxCount,
  onTripSelected,
  factor,
  width = 1200,
  height = 600,
  nodeWidth = 25,
  nodePadding = 15,
  duration = 250,
}: Props): JSX.Element => {
  // Sollte man nur im Notfall nutzen, in diesem ist es aber denke ich gerechtfretigt.
  const svgRef = useRef(null);

  const [svgHeight, setSvgHeight] = useState(600);

  //const bahnRot = "#f01414";
  const rowBackgroundColour = "#cacaca";

  const linkOppacity = 0.4;
  const linkOppacityFocus = 0.7;
  const linkOppacityClear = 0.05;

  const nodeOppacity = 0.9;
  const backdropOppacity = 0.7;
  const rowBackgroundOppacity = 0.0; // AG wollte nicht die 0.2 die vom Team bevorzugt werden

  let thomas = true;

  const data = ExtractStationData({
    stationId: stationId,
    startTime: startTime,
    endTime: endTime,
    maxCount: 0,
    onStatusUpdate: (e) => {
      thomas = e === "success" ? false : true;
    },
  });

  //console.log(data); // for debug purposes

  React.useEffect(() => {
    thomas = true;
    const handleSvgResize = (newSize: number) => {
      setSvgHeight(newSize);
    };

    const graph = Utils.createGraph({
      fNodes: data.fromNodes,
      tNodes: data.toNodes,
      links: data.links,
      onSvgResize: handleSvgResize,
      width,
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
      .attr("fill", rowBackgroundColour)
      .attr("opacity", backdropOppacity)
      .attr("cursor", "pointer")
      .on("click", (_, i) => onTripSelected(i.id, i.name));

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
      .attr("fill", (d) => d.colour || rowBackgroundColour)
      .attr("opacity", nodeOppacity);

    nodes
      .filter((n) => typeof n.id !== "string")
      .attr("cursor", "pointer")
      .on("click", (_, i) => onTripSelected(i.id, i.name));

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
      .attr("opacity", nodeOppacity);

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
      .attr("opacity", nodeOppacity)
      .attr("cursor", "pointer")
      .on("click", (_, i) => onTripSelected(i.id, i.name))
      .style("fill", "url(#diagonalHash)");

    // Add titles for node hover effects.
    nodes.append("title").text((d) => Utils.formatTextNode(d.name, d));

    // Add titles for backdrop hover effects.
    backdrop.append("title").text((d) => Utils.formatTextNode(d.name, d));

    // Add titles for backdrop hover effects.
    overflow.append("title").text((d) => Utils.formatTextNode(d.name, d));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graphTemp.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        Utils.createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0)
      )
      .attr("stroke", (d) => d.colour || rowBackgroundColour)
      .attr("stroke-opacity", linkOppacity)
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
          return Utils.formatTextTime(d);
        }
      })
      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", width)
      .attr("dx", 0)
      .attr("text-anchor", "end");

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.fromNodes.find((n) =>
        Utils.sameId(n.id, d.fNId)
      )?.name;
      const targetName = graph.toNodes.find((n) =>
        Utils.sameId(n.id, d.tNId)
      )?.name;
      return Utils.formatTextLink(sourceName || " – ", targetName || " – ", d);
    });

    // der erste Parameter ist das Event, wird hier allerdings nicht gebraucht.
    // eigentlich ist der Import von dem Interface auch unnötig, aber nun ja...

    const tripIdCompare = (a: TripId, b: TripId) => {
      return (
        a.station_id === b.station_id &&
        a.train_nr === b.train_nr &&
        a.time === b.time &&
        a.target_station_id === b.target_station_id &&
        a.line_id === b.line_id &&
        a.target_time === b.target_time
      );
    };

    const sameId = (a: TripId | string, b: TripId | string) => {
      if (typeof a !== "string" && typeof b !== "string")
        return tripIdCompare(a, b);
      if (typeof a !== typeof b) return false;
      else return a === b;
    };

    function branchAnimate(_: MouseEvent, node: Node) {
      const focusLinks = view.selectAll("path.link").filter((l) => {
        return (
          sameId((l as Link).tNId, node.id) || sameId((l as Link).fNId, node.id)
        );
      });
      focusLinks.attr("stroke-opacity", linkOppacityFocus);

      const clearLinks = view.selectAll("path.link").filter((l) => {
        return (
          !sameId((l as Link).tNId, node.id) &&
          !sameId((l as Link).fNId, node.id)
        );
      });
      clearLinks.attr("stroke-opacity", linkOppacityClear);
    }

    function branchClear() {
      links.attr("stroke-opacity", linkOppacity);
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
      focusLinks.attr("stroke-opacity", linkOppacityFocus);

      const clearLinks = view.selectAll("path.link").filter((l) => {
        return (l as Link).id !== link.id;
      });
      clearLinks.attr("stroke-opacity", linkOppacityClear);
    }

    function linkClear() {
      links.attr("stroke-opacity", linkOppacity);
    }

    links.on("mouseover", linkAnimate).on("mouseout", linkClear);

    thomas = false;
    console.log(data);
    console.log(thomas);
  }, [data]);

  return (
    <>
      {(!data || !data.links.length) && (
        <div>Daten zum Zug nicht verfügbar</div>
      )}
      {thomas && data.links.length > 0 && <Loading />}
      {!thomas && (
        <>
          <svg
            ref={svgRef}
            width={width}
            height={svgHeight}
            className="m-auto"
          />
          <div
            className="flex justify-center"
            data-tooltip="Speicher das Geschehen an dieser Station als eine wunderschöne .svg. :)"
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
