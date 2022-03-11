import React, { MouseEvent, useRef, useState } from "react";
import { BaseType, select as d3Select, Selection } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey
import { Node, Link } from "./SankeyTripTypes";
import {
  createGraph,
  formatTextLink,
  formatTextNode,
  createSankeyLink,
  renderTime,
  renderDelay,
} from "./SankeyTripUtils";
import { TripId } from "../../../api/protocol/motis";
import { ExtractGroupInfoForThisTrain } from "../../TripInfoUtils";
import Modal from "./Modal/Modal";
import config from "../../../config";

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

/**
 * Draw the Graph
 * @param tripId Id des Trips dessen Daten als Graph dargestellt werden sollen
 * @param onStationSelected Funktion die aufgerufen wird wenn auf eine node geklickt wird
 * @param width Breite des Graphen
 * @param nodeWidth Basisbreite einer Node
 * @param nodePadding Basisabstand zwischen 2 Nodes
 * @constructor
 */
const SankeyTripGraph = ({
  tripId,
  onStationSelected,
  width = 1000,
  nodeWidth = 25,
  nodePadding = 15,
}: Props): JSX.Element => {
  const svgRef = useRef(null);

  const [svgHeight, setSvgHeight] = useState(600);
  const [isOpen, setIsOpen] = useState(false);
  const [clickedNode, setClickedNode] = useState<{
    node: Node;
    tripId: TripId;
    currentArrivalTime: number;
    currentDepartureTime: number;
  }>();

  const rowBackgroundColour = "#cacaca";

  const linkOpacity = 0.3;
  const linkOpacityFocus = 0.7;
  const linkOpacityClear = 0.01;

  const nodeOpacity = 0.9;
  const backdropOpacity = 0.7;

  const leftTimeOffset = 100;

  const graphData = ExtractGroupInfoForThisTrain(tripId);

  React.useEffect(() => {
    if (!graphData) return;

    const handleSvgResize = (newSize: number) => {
      setSvgHeight(newSize);
    };

    const graph = createGraph({
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
      .attr("opacity", backdropOpacity)
      .attr("cursor", "pointer");

    // Add the onClick Action for Backdrops
    // TODO: welche Zeit ist hier die richtige?!?! + Anpassen der restlichen Zeiten. (bzw. weitere onStationSelected)
    backdrops.on(
      "click",
      (_, i) => onStationSelected(i.sId, i.name) //, i.arrival_current_time)
    );

    // Define the nodes.
    const nodes = view
      .selectAll("rect.node")
      .data(graph.nodes)
      .join("rect")
      .classed("node", true)
      .attr("cursor", "pointer")
      .attr("id", (d) => d.id)
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr("fill", (d) => d.color || rowBackgroundColour)
      .attr("opacity", nodeOpacity);

    // Add titles for node hover effects.
    nodes
      .append("title")
      .text((d) => formatTextNode(d.name, d.totalNodeValue || 0));
    backdrops
      .append("title")
      .text((d) => formatTextNode(d.name, d.totalNodeValue || 0));

    // Add the onClick Action
    nodes.on("click", (_, i) => onStationSelected(i.sId, i.name));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graph.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0, leftTimeOffset)
      )
      .attr("stroke", (d) => d.color || rowBackgroundColour)
      .attr("stroke-opacity", linkOpacity)
      .attr("stroke-width", (d) => d.width || 1)
      .attr("fill", "none");

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
          currentDepartureTime: d.departure_current_time,
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
          currentDepartureTime: d.departure_current_time,
        });
      });

    view
      .selectAll("text.nodeTime")
      .data(graph.nodes.filter((d) => (d.x1 || 0) < width / 2))
      .join((enter) => {
        const tmp: Selection<SVGTextElement, Node, SVGGElement, unknown> = enter
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
        tmp.append("tspan").text((d) => renderTime(d.arrival_current_time));

        renderDelay(tmp, "arrival");

        tmp
          .append("title")
          .text(
            (d) =>
              `Geplante Abfahrtszeit: ${renderTime(
                d.departure_schedule_time
              )} – Tatsächliche Abfahrtszeit: ${renderTime(
                d.departure_current_time
              )} `
          );
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
        tmp.append("tspan").text((d) => renderTime(d.arrival_current_time));
        renderDelay(tmp, "departure");

        tmp
          .append("title")
          .text(
            (d) =>
              `Geplante Ankunftszeit: ${renderTime(
                d.departure_schedule_time
              )} – Tatsächliche Ankunftszeit: ${renderTime(
                d.departure_current_time
              )} `
          );
        return tmp;
      });

    view
      .append("text")
      .attr("x", leftTimeOffset)
      .attr("dx", -5) //
      .attr("y", 8)
      .attr("dy", 2.5)
      .attr("text-anchor", "end")
      .attr("font-family", config.font_family)
      .attr("font-size", 12)
      .attr("fill", "#a8a8a8")
      .text("ABFAHRT");

    let tempHeight;
    if (graph.nodes[0] && graph.nodes[0].nodeHeight) {
      tempHeight = graph.nodes[0].nodeHeight + 20;
    } else {
      tempHeight = 30;
    }

    view
      .append("text")
      .attr("x", width - leftTimeOffset)
      .attr("dx", 5) //
      .attr("y", tempHeight)
      .attr("text-anchor", "start")
      .attr("font-family", config.font_family)
      .attr("font-size", 12)
      .attr("fill", "#a8a8a8")
      .text("ANKUNFT");

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.nodes.find((n) => n.id == d.source)?.name;
      const targetName = graph.nodes.find((n) => n.id == d.target)?.name;
      return formatTextLink(sourceName || " - ", targetName || " - ", d.value);
    });

    /**
     * erhöht die opacity der links die mit der übergebenen Node verbunden sind
     * @param _ Event (hier nicht benötigt)
     * @param node node deren Links highlighted werden sollen
     */
    function branchShow(_: MouseEvent, node: Node) {
      view.selectAll("path.link").attr("stroke-opacity", linkOpacityClear);

      let links: Selection<BaseType, unknown, SVGElement, unknown>;

      if (node.sourceLinks && node.sourceLinks.length > 0) {
        links = view.selectAll("path.link").filter((link) => {
          return (node.sourceLinks || []).indexOf(link as Link) !== -1;
        });

        links.attr("stroke-opacity", linkOpacityFocus);
      } else if (node.sourceLinks && node.sourceLinks.length === 0) {
        links = view.selectAll("path.link").filter((link) => {
          return (node.targetLinks || []).indexOf(link as Link) !== -1;
        });

        links.attr("stroke-opacity", linkOpacityFocus);
      }
    }

    /**
     * setzt die opacity aller links auf den Ursprungswert zurück
     */
    function branchClear() {
      links.attr("stroke-opacity", 0);
      view.selectAll("path.link").attr("stroke-opacity", linkOpacity);
    }

    // Das für ein einfaches Show/Don't Show
    nodes.on("mouseover", branchShow).on("mouseout", branchClear);
    backdrops.on("mouseover", branchShow).on("mouseout", branchClear);

    /**
     * erhöht die Opacity des Links über den hovered wird und senkt die Opacity aller anderen Links
     * @param _ Event (hier nicht benötigt)
     * @param link Link der highlighted werden soll
     */
    function linkAnimate(_: MouseEvent, link: Link) {
      const links = view.selectAll("path.link").filter((l) => {
        return (l as Link).id === link.id;
      });

      links.attr("stroke-opacity", linkOpacityFocus);
    }

    /**
     * setzt die Opacity aller Links auf den Ursprungswert zurück
     */
    function linkClear() {
      links.attr("stroke-opacity", linkOpacity);
    }

    links.on("mouseover", linkAnimate).on("mouseout", linkClear);
  }, [graphData, nodePadding, nodeWidth, width, onStationSelected, tripId]);

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

export default SankeyTripGraph;
