import {
  Node,
  Link,
  SankeyInterface,
  createGraphInterface,
} from "../StationGraph/SankeyStationTypes";
import { TripId } from "../../../api/protocol/motis";
import { minimalToNode } from "../SankeyUtils";
import { sameId, color, getNode } from "../SankeyUtils";
import { umsteigerConfig } from "../../../config";

/**
 * Berechnet die relative Höhe eines Knotens basierend auf dem
 * Gesamtwert (= gesamte Passagieranzahl),
 * dem Knotenwert (= Passagiere am jeweiligen Bahnhof)
 * und der effektiv nutzbaren Höhe (= Gesamthöhe - NodePadding * (NodeCount - 1))
 * @param nodeValue
 * @param minHeight
 */
const calcNodeHeight = (nodeValue: number, minHeight: number): number => {
  if (nodeValue <= 0) return 0;
  const calcHeight = calcNodeHeightWithoutMinHeight(nodeValue);
  if (calcHeight <= minHeight) return minHeight;
  return calcHeight;
};

/**
 *
 * @param value
 */
const calcNodeHeightWithoutMinHeight = (value: number): number => {
  return value / umsteigerConfig.scaleFactor;
};

/**
 *
 * @param name
 * @param node
 */
export const formatTextNode = (name: string, node: Node): string => {
  return `${name}\n${node.pax} Personen Steigen um. \nMax. Kapazität: ${node.cap} `;
};

/**
 * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
 */
export const createGraph = ({
  fNodes,
  tNodes,
  links,
  onSvgResize,
  nodeWidth = 20,
  nodePadding = 20,
}: createGraphInterface): SankeyInterface => {
  let tNodesFinished: Node[] = [];
  let fNodesFinished: Node[] = [];

  const prPaxColour = "#f20544";
  const boPaxColour = "#f27e93";
  const exPaxColour = "#f27e93";
  const fuPaxColour = "#f20544";

  const { timeOffset, minNodeHeight, width } = umsteigerConfig;

  // fügt previous node zu falls Umsteiger existieren und gibt ihr die Farbe

  const prNode: Node = {
    ...getNode(fNodes, "previous"),
    color: prPaxColour,
  };

  if (prNode.pax > 0) {
    fNodesFinished.push({ ...prNode, name: "previous" });
  }

  // fügt boarding node zu falls Umsteiger existieren und gibt ihr die Farbe

  const boNode: Node = {
    ...getNode(fNodes, "boarding"),
    color: boPaxColour,
  };

  if (boNode.pax > 0) {
    fNodesFinished.push({ ...boNode, name: "boarding" });
  }

  // fügt reguläre Nodes hinzu un bereitet Daten vor
  // beginnt nach previous und board node

  for (const cNode of fNodes) {
    if (typeof cNode.id === "string") continue;

    fNodesFinished.push(minimalToNode(cNode));
  }

  for (const cNode of tNodes) {
    if (typeof cNode.id === "string") continue;

    tNodesFinished.push(minimalToNode(cNode));
  }

  // fügt exiting node zu falls Umsteiger existieren und gibt ihr die Farbe

  const exNode: Node = {
    ...getNode(tNodes, "exiting"),
    color: exPaxColour,
  };

  if (exNode.pax > 0) {
    tNodesFinished.push({ ...exNode, name: "exit" });
  }

  // fügt future node zu falls Umsteiger existieren und gibt ihr die Farbe

  const fuNode: Node = {
    ...getNode(tNodes, "future"),
    color: fuPaxColour,
  };

  if (fuNode.pax > 0) {
    tNodesFinished.push({ ...fuNode, name: "future" });
  }

  // sort nodes by arrival time first, then by departure time

  fNodesFinished.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    else return 0;
  });

  tNodesFinished.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    else return 0;
  });

  // assign every node a colour depending on the amount of nodes on every side

  const calcColor = (nArray: Node[], n: number) => {
    const calcNodes = [];
    for (const i in nArray) {
      const cNode = nArray[i];
      if (typeof cNode.id === "string") continue;
      if (Number(i) === n) {
        calcNodes.push({ ...cNode, color: "#f20544" });
      } else {
        calcNodes.push({
          ...cNode,
          color: color(Number(i), nArray.length),
        });
      }
    }
    return calcNodes;
  };

  fNodesFinished = calcColor(fNodesFinished, fNodesFinished.length - 1);
  tNodesFinished = calcColor(tNodesFinished, 0);

  // Berechnen der Höhe der Nodes.

  let finalHeight = 0;

  const assignHeight = (n: Node[]) => {
    const calcNodes = [];
    for (const cNode of n) {
      cNode.backdropHeight = calcNodeHeightWithoutMinHeight(cNode.cap);
      cNode.nodeHeight = calcNodeHeightWithoutMinHeight(cNode.pax);
      calcNodes.push(cNode);
    }
    return calcNodes;
  };

  fNodesFinished = assignHeight(fNodesFinished);
  tNodesFinished = assignHeight(tNodesFinished);

  // Falls einer der Links einer Node unter Minimum height ist muss auf die Höhe der Node die Differenz

  const addHeightDiff = <
    K extends keyof { fNId: TripId | string; tNId: TripId | string }
  >(
    n: Node[],
    selector: K
  ) => {
    const calcNodes = [];
    for (const cNode of n) {
      if (!(cNode.backdropHeight && cNode.nodeHeight)) continue;

      const currentLinks = links.filter((a) => sameId(a[selector], cNode.id));
      for (const cLink of currentLinks) {
        if (calcNodeHeightWithoutMinHeight(cLink.value) < minNodeHeight) {
          const heightDiff =
            calcNodeHeight(cLink.value, minNodeHeight) -
            calcNodeHeightWithoutMinHeight(cLink.value);
          cNode.backdropHeight += heightDiff;
          cNode.nodeHeight += heightDiff;
        }
      }
      calcNodes.push(cNode);
    }
    return calcNodes;
  };

  fNodesFinished = addHeightDiff(fNodesFinished, "fNId");
  tNodesFinished = addHeightDiff(tNodesFinished, "tNId");

  // berechnen der Koordinaten der Nodes

  const calcNodeXY = (nArray: Node[], x0: number, x1: number) => {
    const calcNodes: Node[] = [];
    for (const i in nArray) {
      const cNode = nArray[i];
      if (!(cNode.backdropHeight && cNode.nodeHeight)) continue;

      // calc height difference between the nodes generated in case of a train having reached > 100% cap

      let diff = 0;
      if (cNode.backdropHeight < cNode.backdropHeight) {
        diff = cNode.backdropHeight - cNode.backdropHeight;
      }
      let fullPadding = 0;
      if (cNode.full) {
        fullPadding = cNode.nodeHeight - cNode.backdropHeight;
      }

      const y1_start =
        (nArray[Math.max(0, Number(i) - 1)].y1_backdrop ||
          umsteigerConfig.yMargin) + fullPadding;

      cNode.y0_backdrop =
        y1_start + (Number(i) === 0 ? 0 : nodePadding) + diff / 2;
      cNode.y1_backdrop = cNode.y0_backdrop + cNode.backdropHeight;

      cNode.y1 = cNode.y1_backdrop;
      cNode.y0 = cNode.y1 - cNode.nodeHeight;

      cNode.x1 = x1;
      cNode.x0 = x0;

      calcNodes.push(cNode);
      finalHeight = Math.max(finalHeight, cNode.y1);
    }
    return calcNodes;
  };

  fNodesFinished = calcNodeXY(
    fNodesFinished,
    timeOffset,
    nodeWidth + timeOffset
  );
  tNodesFinished = calcNodeXY(
    tNodesFinished,
    width - nodeWidth - timeOffset,
    width - timeOffset
  );

  onSvgResize(finalHeight + umsteigerConfig.yMargin); // set height of svg to the bottom of the last node + buffer

  // berechnen der Links

  const calculatedLinks: Link[] = [];

  const indexOfTripId = (idArray: (string | TripId)[], id: string | TripId) => {
    return idArray.findIndex((idX) => sameId(idX, id));
  };

  for (const cNode of fNodesFinished) {
    const fNodeId = cNode.id;

    const tempArray = tNodesFinished.map((n) => n.id);
    const currentLinks = links
      .filter((a) => sameId(a.fNId, fNodeId))
      .sort((a, b) => {
        if (indexOfTripId(tempArray, a.tNId) > indexOfTripId(tempArray, b.tNId))
          return -1;
        if (indexOfTripId(tempArray, a.tNId) < indexOfTripId(tempArray, b.tNId))
          return 1;
        else return 0;
      });

    let offset = 0;
    for (const i in currentLinks) {
      const cLink: Link = currentLinks[i];
      const width = calcNodeHeight(cLink.value, minNodeHeight);
      const l: Link = {
        ...cLink,
        width: width,
        y0: (cNode.y1 || 0) - offset - width / 2,
        color: cNode.color,
      };
      offset += width;

      calculatedLinks.push(l);
    }
  }

  const finishedLinks: Link[] = [];

  for (const cNode of tNodesFinished) {
    const tNodeId = cNode.id;
    const currentLinks = calculatedLinks
      .filter((a) => sameId(a.tNId, tNodeId))
      .reverse();

    let offset = 0;
    for (const i in currentLinks) {
      const cLink: Link = currentLinks[i];
      const l: Link = {
        ...cLink,
        y1: (cNode.y1 || 0) - offset - (cLink.width || 0) / 2, // /2 um Mitte zu haben
      };
      offset += cLink.width || 0;
      if (cLink.width) {
        finishedLinks.push(l);
      }
    }
  }

  return {
    toNodes: tNodesFinished,
    fromNodes: fNodesFinished,
    links: finishedLinks,
  };
};
