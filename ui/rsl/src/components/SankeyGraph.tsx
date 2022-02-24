import React, { MouseEvent, useRef, useState } from "react";
import { select as d3Select, create as d3create } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey

import { Node, Link } from "./SankeyTypes";
import Utils from "./SankeyUtilsAbsolute";
import { TripId } from "../api/protocol/motis";
import { ExtractGroupInfoForThisTrain } from "./TripInfoUtils";

import Modal from "./Modal";
import config from "../config";

type Props = {
  tripId: TripId;
  onStationSelected: (sId: string, name: string) => void;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
  minNodeHeight?: number;
};

const SankeyGraph = ({
  tripId,
  onStationSelected,
  width = 1000,
  nodeWidth = 25,
  nodePadding = 15,
  duration = 250, // deprecated
}: Props): JSX.Element => {
  const svgRef = useRef(null);

  const [svgHeight, setSvgHeight] = useState(600);
  const [isOpen, setIsOpen] = useState(false);
  const [clickedNode, setClickedNode] = useState<{
    node: Node;
    tripId: TripId;
    currentArrivalTime: number;
    currentDepatureTime: number;
  }>();

  //const bahnRot = "#f01414";
  const rowBackgroundColour = "#cacaca";

  const linkOppacity = 0.3;
  const linkOppacityFocus = 0.7;
  const linkOppacityClear = 0.01;

  const nodeOppacity = 0.9;
  const backdropOppacity = 0.7;
  const rowBackgroundOppacity = 0; // na, wenn die AGs das so wollen :(

  const leftTimeOffset = 100;

  const graphData = ExtractGroupInfoForThisTrain(tripId);

  React.useEffect(() => {
    if (!graphData) return;

    const handleSvgResize = (newSize: number) => {
      setSvgHeight(newSize);
    };

    const graph = Utils.createGraph({
      nodes: graphData.nodes,
      links: graphData.links,
      onSvgResize: handleSvgResize,
      width,
      nodeWidth,
      nodePadding,
      leftTimeOffset,
    });

    const svg = d3Select(svgRef.current);
    // Säubern von potentiellen svg Inhalt
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Add definitions for all of the linear gradients.
    const gradients = defs
      .selectAll("linearGradient")
      .data(graph.links)
      .join("linearGradient")
      .attr("id", (d) => "gradient_" + d.id);
    gradients.append("stop").attr("offset", 0.0);
    gradients.append("stop").attr("offset", 1.0);

    const hatchPattern = defs
      .append("pattern")
      .attr("id", "diagonalHash")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", "4")
      .attr("height", "4")
      .append("g")
      .style("fill", "none")
      .style("stroke", "#cacaca")
      .style("stroke-width", 1.5);
    hatchPattern.append("path").attr("d", "M-1,1 l2,-2");
    hatchPattern.append("path").attr("d", "M0,4 l4,-4");
    hatchPattern.append("path").attr("d", "M3,5 l2,-2");

    // Add a g.view for holding the sankey diagram.
    const view = svg.append("g").classed("view", true);

    // Define the row backgrounds of every row
    view
      .selectAll("rect.rowBackground")
      .data(graph.nodes)
      .join("rect")
      .classed("rowBackground", true)
      .filter((d) => (d.x0 || width) < width)
      .attr("id", (d) => d.id + "_background")
      .attr("x", 0)
      .attr("y", (d) => d.y0_backdrop || 0)
      .attr("width", width)
      .attr("height", (d) =>
        Math.max(0, (d.y1_backdrop || 0) - (d.y0_backdrop || 0))
      )
      .attr("fill", rowBackgroundColour)
      .attr("opacity", rowBackgroundOppacity);

    // Define the BACKDROPS – Die grauen Balken hinter den nicht "vollen" Haltestellen.
    const backdrops = view
      .selectAll("rect.nodeBackdrop")
      .data(graph.nodes.filter((n) => (n.nodeHeight || 0) === 0))
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
      .attr("cursor", "pointer");

    // Add the onClick Action for Backdrops
    backdrops.on("click", (_, i) => onStationSelected(i.sId, i.name));

    // Define the nodes.
    const nodes = view
      .selectAll("rect.node")
      .data(graph.nodes)
      .join("rect")
      .classed("node", true)
      .attr("cursor", "pointer")
      .attr("id", (d) => d.id) // TODO: Das habe ich zu sId geändert, um das clicken einfacher zu maken.
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr("fill", (d) => d.colour || rowBackgroundColour)
      .attr("opacity", nodeOppacity);

    // Add titles for node hover effects.
    nodes
      .append("title")
      .text((d) => Utils.formatTextNode(d.name, d.totalNodeValue || 0));
    backdrops
      .append("title")
      .text((d) => Utils.formatTextNode(d.name, d.totalNodeValue || 0));

    // Add the onClick Action
    nodes.on("click", (_, i) => onStationSelected(i.sId, i.name));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graph.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        Utils.createSankeyLink(
          nodeWidth,
          width,
          d.y0 || 0,
          d.y1 || 0,
          leftTimeOffset
        )
      )
      .attr("stroke", (d) => d.colour || rowBackgroundColour)
      .attr("stroke-opacity", linkOppacity)
      .attr("stroke-width", (d) => d.width || 1)
      .attr("fill", "none");
    /*
    const gradientLinks = view
      .selectAll("path.gradient-link")
      .data(graph.links)
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
      .data(graph.nodes)
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
      .attr("font-family", config.font_family)
      .text((d) => d.name)
      .on("click", (_, d) => {
        setIsOpen(true);
        setClickedNode({
          node: d,
          tripId: tripId,
          currentArrivalTime: d.arrival_current_time,
          currentDepatureTime: d.departure_current_time,
        });
      })
      .attr("cursor", "pointer")
      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", (d) => d.x0 || 0)
      .attr("dx", -6)
      .attr("text-anchor", "end")
      .attr("cursor", "pointer")
      .on("click", (_, d) => {
        setIsOpen(true);
        setClickedNode({
          node: d,
          tripId: tripId,
          currentArrivalTime: d.arrival_current_time,
          currentDepatureTime: d.departure_current_time,
        });
      });

    // *************************************************
    // Add text labels for time.
    /*
    view
      .selectAll("text.nodeTime")
      .data(graph.nodes.filter((d) => (d.x1 || 0) < width / 2))
      .join((enter) => {
        const tmp = enter
          .append("text")
          .classed("node", true)
          .attr("x", 0)
          .attr("dx", leftTimeOffset - 5)
          .attr(
            "y",
            (d) =>
              (d.y0_backdrop || 0) +
              ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
          )
          .attr("dy", 2.5)
          .attr("text-anchor", "end")
          .attr("font-family", config.font_family)
          .attr("font-size", 10)
          .attr("fill", "#a8a8a8")
          .attr("font-weight", "bold");

        tmp.append("tspan").text((d) => "10:30Uhr");

        tmp.append("tspan").text(" (");
        tmp
          .append("tspan")
          .text("+100min")
          .attr("fill", "red")
          .attr("font-weight", "bold");
        tmp.append("tspan").text(")");
      });
*/
    view
      .selectAll("text.nodeTime")
      .data(graph.nodes.filter((d) => (d.x1 || 0) < width / 2))
      .join((enter) => {
        const tmp = enter
          .append("text")
          .classed("node", true)
          .attr("x", 0)
          .attr("dx", leftTimeOffset - 5)
          .attr(
            "y",
            (d) =>
              (d.y0_backdrop || 0) +
              ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
          )
          .attr("dy", 2.5)
          .attr("text-anchor", "end")
          .attr("font-family", config.font_family)
          .attr("font-size", 10)
          .attr("fill", "#a8a8a8")
          .attr("font-weight", "bold");

        // Die eigentliche Zeit
        tmp
          .append("tspan")
          .text((d) => Utils.renderTime(d.arrival_current_time));

        //tmp.append("tspan").text(" (");
        // Die
        Utils.renderDelay(tmp, "arrival");

        tmp
          .append("title")
          .text(
            (d) =>
              `Geplante Abfahrtszeit: ${Utils.renderTime(
                d.departure_schedule_time
              )} – Tatsächliche Abfahrtszeit: ${Utils.renderTime(
                d.departure_current_time
              )} `
          );
        //tmp.append("tspan").text(")");
        return tmp;
      });

    view
      .selectAll("text.nodeTime")
      .data(graph.nodes.filter((d) => (d.x1 || 0) > width / 2))
      .join((enter) => {
        const tmp = enter
          .append("text")
          .classed("node", true)
          .attr("x", (d) => d.x0 || 0)
          .attr("dx", 5 + nodeWidth)
          .attr(
            "y",
            (d) =>
              (d.y0_backdrop || 0) +
              ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
          )
          .attr("dy", 2.5)
          .attr("text-anchor", "start")
          .attr("font-family", config.font_family)
          .attr("font-size", 10)
          .attr("fill", "#a8a8a8")
          .attr("font-weight", "bold");

        // Die eigentliche Zeit
        tmp
          .append("tspan")
          .text((d) => Utils.renderTime(d.arrival_current_time));

        //tmp.append("tspan").text(" (");
        // Die
        Utils.renderDelay(tmp, "depature");

        tmp
          .append("title")
          .text(
            (d) =>
              `Geplante Ankunftszeit: ${Utils.renderTime(
                d.departure_schedule_time
              )} – Tatsächliche Ankunftszeit: ${Utils.renderTime(
                d.departure_current_time
              )} `
          );
        //tmp.append("tspan").text(")");
        return tmp;
      });
    /*
      .classed("node", true)
      .attr("x", 0)
      .attr("dx", leftTimeOffset - 5)
      .attr(
        "y",
        (d) =>
          (d.y0_backdrop || 0) +
          ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
      )
      .attr("dy", 2.5)
      .attr("fill", "#a8a8a8")
      .attr("text-anchor", "end")
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("font-family", config.font_family)
      //.text((d) => "10:30Uhr (+100min)")
      .text((d) => "10:30Uhr")
      .append("tspan")
      .text("Bobo")

      .text("--------");*/
    // *************************************************

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.nodes.find((n) => n.id == d.source)?.name;
      const targetName = graph.nodes.find((n) => n.id == d.target)?.name;
      return Utils.formatTextLink(
        sourceName || " - ",
        targetName || " - ",
        d.value
      );
    });

    // der erste Parameter ist das Event, wird hier allerdings nicht gebraucht.
    // eigentlich ist der Import von dem Interface auch unnötig, aber nun ja...
    function branchShow(_: MouseEvent, node: Node) {
      view.selectAll("path.link").attr("stroke-opacity", linkOppacityClear);

      let links: d3.Selection<d3.BaseType, unknown, SVGElement, unknown>;

      if (node.sourceLinks && node.sourceLinks.length > 0) {
        links = view.selectAll("path.link").filter((link) => {
          return (node.sourceLinks || []).indexOf(link as Link) !== -1;
        });

        links.attr("stroke-opacity", linkOppacityFocus);
        //.attr("stroke-dashoffset", 0);
      } else if (node.sourceLinks && node.sourceLinks.length === 0) {
        links = view.selectAll("path.link").filter((link) => {
          return (node.targetLinks || []).indexOf(link as Link) !== -1;
        });

        links.attr("stroke-opacity", linkOppacityFocus);
        //.attr("stroke-dashoffset", 0);
      }
    }

    function branchClear() {
      links.attr("stroke-opactiy", 0); //.each(setDash);
      view.selectAll("path.link").attr("stroke-opacity", linkOppacity);
    }

    // TODO:
    // Das ist für die Animation:
    //nodes.on("mouseover", branchAnimate).on("mouseout", branchClear);
    // Das für ein einfaches Show/Don't Show
    nodes.on("mouseover", branchShow).on("mouseout", branchClear);
    backdrops.on("mouseover", branchShow).on("mouseout", branchClear);

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
  }, [graphData]);

  return (
    <>
      {!graphData && <div>Daten zum Zug nicht verfügbar</div>}
      {isOpen && <Modal setIsOpen={setIsOpen} param={clickedNode} />}
      {graphData && (
        <svg
          ref={svgRef}
          width={width}
          height={svgHeight}
          className="m-auto"
          style={{ marginBottom: "1.45rem" }} // TODO: das ist nur testweise wegen der besseren Lesbarkeit.
        />
      )}
    </>
  );
};

export default SankeyGraph;
