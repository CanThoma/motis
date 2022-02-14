import React, { MouseEvent } from "react";
import * as d3 from "d3";
// import { select as d3Select, easeLinear } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey

import {
  Node,
  Link,
  SankeyInterfaceMinimal,
  NodeMinimal,
  LinkMinimal,
  stationGraphDefault,
} from "./SankeyStationTypes";
import Utils from "./SankeyStationUtils";
import { interpolate } from "d3";
import { TripId } from "../api/protocol/motis";
import { useAtom } from "jotai";
import { universeAtom } from "../data/simulation";
import {
  usePaxMonGetInterchangesQuery,
  usePaxMonGroupsInTripQuery,
} from "../api/paxmon";
import { PaxMonGetInterchangesRequest } from "../api/protocol/motis/paxmon";
import { ExtractStationData } from "./StationInfoUtils";

type Props = {
  stationId: string;
  startTime: number;
  endTime: number;
  maxCount: number;
  onTripSelected: (id: TripId | string, name: string) => void;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};

const SankeyStationGraph = ({
  stationId,
  startTime,
  endTime,
  maxCount,
  onTripSelected,
  width = 600,
  height = 600,
  nodeWidth = 25,
  nodePadding = 15,
  duration = 250,
}: Props): JSX.Element => {
  // Sollte man nur im Notfall nutzen, in diesem ist es aber denke ich gerechtfretigt.
  const svgRef = React.useRef(null);

  //const bahnRot = "#f01414";
  const rowBackgroundColour = "#cacaca";

  const linkOppacity = 0.5;
  const linkOppacityFocus = 0.7;
  const linkOppacityClear = 0.01;

  const nodeOppacity = 0.9;
  const backdropOppacity = 0.7;
  const rowBackgroundOppacity = 0.0; // AG wollte nicht die 0.2 die vom Team bevorzugt werden

  const data = ExtractStationData({
    stationId: stationId,
    startTime: startTime,
    endTime: endTime,
    maxCount: 0,
  });

  //console.log(data); // for debug purposes

  React.useEffect(() => {
    const graph = Utils.createGraph(
      data.fromNodes,
      data.toNodes,
      data.links,
      height,
      width,
      nodeWidth,
      nodePadding
    );

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
      .attr("width", "4")
      .attr("height", "4")
      .append("g")
      .style("fill", "none")
      .style("stroke", "#f01414")
      .style("stroke-width", 1);
    hatchPattern.append("path").attr("d", "M-1,1 l2,-2");
    hatchPattern.append("path").attr("d", "M0,4 l4,-4");
    hatchPattern.append("path").attr("d", "M3,5 l2,-2");

    const hatchPattern2 = defs
      .append("pattern")
      .attr("id", "diagonalHash2")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", "10")
      .attr("height", "10")
      .attr("patternTransform", "rotate(45)")
      .append("g")
      .style("fill", "none")
      .style("stroke", "#f01414")
      .style("stroke-width", 5);
    hatchPattern2
      .append("line")
      .attr("x1", 5)
      .attr("y", 0)
      .attr("x2", 5)
      .attr("y2", 10);

    // Add a g.view for holding the sankey diagram.
    const view = svg.append("g").classed("view", true);

    // Define the row backgrounds of every row
    view
      .selectAll("rect.rowBackground")
      .data(graphTemp.nodes)
      .join("rect")
      .classed("rowBackground", true)
      .filter((d) => (d.x0 || width) < width)
      .attr("id", (d) => d.id + "_background")
      .attr("x", 0)
      .attr("y", (d) => d.y0_backdrop || 0)
      .attr("width", width)
      .attr("height", (d) =>
        Math.max(10, (d.y1_backdrop || 0) - (d.y0_backdrop || 0))
      )
      .attr("fill", rowBackgroundColour)
      .attr("opacity", rowBackgroundOppacity)
      .attr("cursor", "pointer")
      .on("click", (_, i) => onTripSelected(i.id, i.name));

    // Define the BACKDROPS – Die grauen Balken hinter den nicht "vollen" Haltestellen.
    view
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
      .attr("opacity", backdropOppacity);

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
      .attr("cursor", "pointer")
      .attr("opacity", nodeOppacity);

    // Add the onClick Action
    nodes.on("click", (_, i) => onTripSelected(i.id, i.name));

    // Add titles for node hover effects.
    nodes.append("title").text((d) => Utils.formatTextNode(d.name, d.pax || 0));

    //Define the Overflow
    const overflow = view
      .selectAll("rect.nodeOverflow")
      .data(graphTemp.nodes.filter((n) => n.full))
      .join("rect")
      .classed("nodeOverflow", true)
      .attr("id", (n) => String(n.id) + "a")
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y0_backdrop || 0) - (d.y0 || 0)))
      .attr("cursor", "pointer")
      /*
      .attr(
        "fill",
        (d) =>
          d3.interpolateRgb.gamma(0.1)("orange", "red")(d.cap / d.pax) ||
          rowBackgroundColour
      )
      */
      .attr("opacity", nodeOppacity)
      .style("fill", "url(#diagonalHash2)")
      // Zeug für die Animation
      .append("animate")
      .attr("attributeName", "height")
      .attr("from", (d) => Math.max(0, (d.y0_backdrop || 0) - (d.y0 || 0)))
      .attr(
        "to",
        (d) =>
          (d.y1 || 0) -
          (d.y0_backdrop || 0) +
          Math.max(0, (d.y0_backdrop || 0) - (d.y0 || 0))
      )
      .attr("dur", "5s")
      .attr("repeatCount", "indefinite");

    // Zeug für den "Tooltip"
    /*
    view
      .selectAll("rect.nodeOverflow")
      .append("foreignObject")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 160)
      .attr("height", 160)
      .append("body")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .append("div")
      .text(`Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      Sed mollis mollis mi ut ultricies. Nullam magna ipsum,
      porta vel dui convallis, rutrum imperdiet eros. Aliquam
      erat volutpat.`);
      */

    overflow.on("click", (_, i) => onTripSelected(i.id, i.name));

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

    /*
          const gradientLinks = view
            .selectAll("path.gradient-link")
            .data(graphTemp.links)
            .join("path")
            .classed("gradient-link", true)
            .attr("id", (d) => "path_" + d.id)
            .attr("d", (d) =>
              Utils.createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0)
            )
            .attr("stroke", (d) => d.colour || rowBackgroundColour)
            .attr("stroke-opacity", linkOppacityFocus)
            .attr("stroke-width", (d) => d.width || 1)
            .attr("fill", "none")
            .each(setDash);

       */

    // Add text labels.
    view
      .selectAll("text.node")
      .data(graphTemp.nodes)
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
      .on("click", (_, i) => onTripSelected(i.id, i.name))
      .attr("cursor", "pointer")
      .text((d) => d.name)
      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", (d) => d.x0 || 0)
      .attr("dx", -6)
      .attr("text-anchor", "end")
      .attr("cursor", "pointer")
      .on("click", (_, i) => onTripSelected(i.id, i.name));

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.fromNodes.find((n) => n.id === d.fNId)?.name;
      const targetName = graph.toNodes.find((n) => n.id === d.tNId)?.name;
      return Utils.formatTextLink(
        sourceName || " – ",
        targetName || " – ",
        d.value
      );
    });

    function branchShow(_: MouseEvent, node: Node) {
      view.selectAll("path.link").attr("stroke-opacity", linkOppacityClear);

      let links: d3.Selection<d3.BaseType, unknown, SVGElement, unknown>;
      console.log(node);
      if (node.sourceLinks && node.sourceLinks.length > 0) {
        links = view.selectAll("path.link").filter((link) => {
          for (let i = 0; i < (node.sourceLinks || []).length; i++) {
            if ((node.sourceLinks || [])[i].id === (link as Link).id) {
              return true;
            }
          }
          return false;
        });

        links.attr("stroke-opacity", linkOppacityFocus);
      } else if (node.targetLinks && node.targetLinks.length > 0) {
        console.log(node);
        links = view.selectAll("path.link").filter((link) => {
          for (let i = 0; i < (node.targetLinks || []).length; i++) {
            if ((node.targetLinks || [])[i].id === (link as Link).id) {
              return true;
            }
          }
          return false;
        });

        links.attr("stroke-opacity", linkOppacityFocus);
      }
    }

    function branchClear() {
      view.selectAll("path.link").attr("stroke-opacity", linkOppacity);
    }

    // TODO:
    // Das ist für die Animation:
    //nodes.on("mouseover", branchAnimate).on("mouseout", branchClear);
    // Das für ein einfaches Show/Don't Show
    nodes.on("mouseover", branchShow).on("mouseout", branchClear);

    function linkAnimate(_: MouseEvent, link: Link) {
      const links = view.selectAll("path.link").filter((l) => {
        return (l as Link).id === link.id;
      });

      links.attr("stroke-opacity", linkOppacityFocus);
    }
    function linkClear() {
      links.attr("stroke-opacity", linkOppacity);
    }

    links.on("mouseover", linkAnimate).on("mouseout", linkClear);
  }, [data, height, width, nodeWidth, nodePadding, duration]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height + 15000}
      className="m-auto"
    />
  );
};

export default SankeyStationGraph;
