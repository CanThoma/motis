import {
  Node,
  Link,
  SankeyInterface,
  createGraphInterface,
} from "./SankeyStationTypes";
import { TripId } from "../../../api/protocol/motis";
import { minimalToNode, sameId, getNode, color } from "../SankeyUtils";
import { timeOffset } from "../../../config";

/**
 * Berechnet die relative Höhe eines Knotens basierend auf dem
 * Gesamtwert (= gesamte Passagieranzahl),
 * dem Knotenwert (= Passagiere am jeweiligen Bahnhof)
 * und der effektiv nutzbaren Höhe (= Gesamthöhe - NodePadding * (NodeCount - 1))
 * @param nodeValue Anzahl an Passagieren
 * @param minHeight Minimale Höhe einer Node
 * @param factor Faktor zur Skalierung der Höhe
 */
const calcNodeHeight = (
  nodeValue: number,
  minHeight: number,
  factor = 15
): number => {
  if (nodeValue <= 0) return 0;
  const calcHeight = calcNodeHeightWithoutMinHeight(nodeValue, factor);
  if (calcHeight <= minHeight) return minHeight;
  return calcHeight;
};

/**
 * Funktion zur Skalierung der Funktion unter Annahme das die minimale Höhe nicht unterschritten.
 * @param value Anzahl an Passagieren
 * @param factor Skalierungsfaktor
 */
const calcNodeHeightWithoutMinHeight = (value: number, factor = 15): number => {
  return value / factor;
};

/**
 * Erstellt den text um den Titel der Nodes zu füllen
 * Unterscheidet zwischen string Ids und TripId Ids um die richtigen Titel zu vergeben
 * @param node Node für die der String generiert werden soll
 */
export const formatTextNode = (node: Node): string => {
  if (typeof node.id === "string") {
    switch (node.id) {
      case "previous":
        return `${node.pax} people coming from trips outside the selected timeframe.`;
      case "boarding":
        return `${node.pax} people starting their trip at this station.`;
      case "future":
        return `${node.pax} people boarding trips outside the selected timeframe.`;
      case "exiting":
        return `${node.pax} people ending their trip at this station.`;
      default:
        return "";
    }
  } else
    return `${node.name}\n${node.pax} Passagiere\nEin-/Aussteiger: ${
      node.linkPaxSum
    } \nKapazität: ${node.cap} \nAuslastung: ${Math.ceil(
      (node.pax / node.cap) * 100
    )}%`;
};

/**
 * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
 * @param fNodes
 * @param tNodes
 * @param links
 * @param onSvgResize
 * @param width
 * @param nodeWidth
 * @param nodePadding
 * @param factor
 */
export const createGraph = ({
  fNodes,
  tNodes,
  links,
  onSvgResize,
  width = 600,
  nodeWidth = 20,
  nodePadding = 20,
  factor = 4,
}: createGraphInterface): SankeyInterface => {
  const fNodesFinished: Node[] = [];
  const tNodesFinished: Node[] = [];

  const prPaxColour = "#f20544";
  const boPaxColour = "#f27e93";
  const exPaxColour = "#f27e93";
  const fuPaxColour = "#f20544";

  const minNodeHeight = 2;
  const yPadding = 10;

  // #####################################################################################
  // Berechnung der Nodes
  // #####################################################################################

  // fügt previous node zu, falls Umsteiger existieren und gibt ihr die Farbe

  const prNode: Node = {
    ...getNode(fNodes, "previous"),
    color: prPaxColour,
  };

  if (prNode.pax > 0) {
    fNodesFinished.push({ ...prNode, name: "previous" });
    tNodesFinished.push({ ...prNode, pax: 0 });
  }

  // fügt boarding node zu, falls Umsteiger existieren und gibt ihr die Farbe

  const boNode: Node = {
    ...getNode(fNodes, "boarding"),
    color: boPaxColour,
  };

  if (boNode.pax > 0) {
    fNodesFinished.push({ ...boNode, name: "boarding" });
    tNodesFinished.push({ ...boNode, pax: 0 });
  }

  // Fügt reguläre Nodes hinzu, und bereitet Daten vor.
  // Beginnt nach previous und board Node.

  for (const cNode of fNodes) {
    if (typeof cNode.id === "string") continue;

    fNodesFinished.push(minimalToNode(cNode));
    tNodesFinished.push({
      ...cNode,
      pax: 0,
      full: false,
    });
  }

  const indexOfTripId = (idArray: (string | TripId)[], id: string | TripId) => {
    return idArray.findIndex((idX) => sameId(idX, id));
  };

  for (const cNode of tNodes) {
    if (typeof cNode.id === "string") continue;

    const tempArray = fNodesFinished.filter((n) => sameId(cNode.id, n.id));
    if (tempArray !== undefined && tempArray.length > 0) {
      const i = indexOfTripId(
        fNodesFinished.map((n) => n.id),
        cNode.id
      );

      tNodesFinished[i] = {
        ...cNode,
        full: cNode.cap < cNode.pax,
        name:
          cNode.name.substr(0, cNode.name.indexOf(" (")) +
          " \u2192 " +
          cNode.name.substr(
            cNode.name.indexOf(" - ") + 2,
            cNode.name.length - cNode.name.indexOf(" - ") - 3
          ),
      };
    } else {
      fNodesFinished.push({
        ...cNode,
        pax: 0,
        full: false,
      });
      tNodesFinished.push(minimalToNode(cNode));
    }
  }

  // fügt exiting node zu falls Umsteiger existieren und gibt ihr die Farbe

  const exNode: Node = {
    ...getNode(tNodes, "exiting"),
    color: exPaxColour,
  };

  if (exNode.pax > 0) {
    fNodesFinished.push({ ...exNode, pax: 0 });
    tNodesFinished.push({ ...exNode, name: "exit" });
  }

  // fügt future node zu falls Umsteiger existieren und gibt ihr die Farbe

  const fuNode: Node = {
    ...getNode(tNodes, "future"),
    color: fuPaxColour,
  };

  if (fuNode.pax > 0) {
    fNodesFinished.push({ ...fuNode, pax: 0 });
    tNodesFinished.push({ ...fuNode, name: "future" });
  }

  // sort nodes by arrival time first, then by departure time

  fNodesFinished.sort((a, b) => {
    if (a.time < b.time) return -1;
    if (a.time > b.time) return 1;
    else return 0;
  });

  const nodeIdArray: (string | TripId)[] = tNodesFinished.map((a) => a.id);

  //swap indices where they differ in tNodeArray
  for (let i = 0; i < tNodesFinished.length; i++) {
    const currentFNode = fNodesFinished[i];
    const tNodeIndex = indexOfTripId(nodeIdArray, currentFNode.id);
    if (tNodeIndex != i) {
      const currentTNode = tNodesFinished[i];
      tNodesFinished[i] = tNodesFinished[tNodeIndex];
      tNodesFinished[tNodeIndex] = currentTNode;
      nodeIdArray[i] = tNodesFinished[i].id;
      nodeIdArray[tNodeIndex] = currentTNode.id;
    }
  }

  for (const i in fNodesFinished) {
    if (typeof fNodesFinished[i].id === "string") continue;
    fNodesFinished[i] = {
      ...fNodesFinished[i],
      color: color(Number(i), fNodesFinished.length),
    };
    tNodesFinished[i] = {
      ...tNodesFinished[i],
      color: color(Number(i), tNodesFinished.length),
    };
  }

  // Berechnen der Höhe der Nodes und Zuweisung der entsprechenden Koordinaten.

  let finalHeight = 0;

  for (let i = 0; i < tNodesFinished.length; i++) {
    const currentTNode = tNodesFinished[i];
    const currentFNode = fNodesFinished[i];

    if (!(currentFNode && currentTNode)) continue;

    currentTNode.backdropHeight = calcNodeHeightWithoutMinHeight(
      currentTNode.cap,
      factor
    );
    currentFNode.backdropHeight = calcNodeHeightWithoutMinHeight(
      currentFNode.cap,
      factor
    );

    currentTNode.nodeHeight = calcNodeHeightWithoutMinHeight(
      currentTNode.pax,
      factor
    );
    currentFNode.nodeHeight = calcNodeHeightWithoutMinHeight(
      currentFNode.pax,
      factor
    );

    // vergrößere Nodes falls links wegen minimaler link Größe vergrößert wurden
    // berechne gleichzeitig die summe der Aus-/Einsteiger

    let linkPaxSum = 0;
    const currentFLinks = links.filter((a) => sameId(a.fNId, currentFNode.id));

    for (const cLink of currentFLinks) {
      linkPaxSum += cLink.value;
      if (calcNodeHeightWithoutMinHeight(cLink.value, factor) < minNodeHeight) {
        const heightDiff =
          calcNodeHeight(cLink.value, minNodeHeight, factor) -
          calcNodeHeightWithoutMinHeight(cLink.value, factor);
        currentFNode.backdropHeight += heightDiff;
        currentFNode.nodeHeight += heightDiff;
        currentTNode.backdropHeight += heightDiff;
      }
    }
    currentFNode.linkPaxSum = linkPaxSum;

    linkPaxSum = 0;
    const currentTLinks = links.filter((a) => sameId(a.tNId, currentTNode.id));

    for (const cLink of currentTLinks) {
      linkPaxSum += cLink.value;
      if (calcNodeHeightWithoutMinHeight(cLink.value, factor) < minNodeHeight) {
        const heightDiff =
          calcNodeHeight(cLink.value, minNodeHeight, factor) -
          calcNodeHeightWithoutMinHeight(cLink.value, factor);
        currentTNode.backdropHeight += heightDiff;
        currentTNode.nodeHeight += heightDiff;
        currentFNode.backdropHeight += heightDiff;
      }
    }
    currentTNode.linkPaxSum = linkPaxSum;

    let fDif = 0;
    if (currentFNode.backdropHeight < currentTNode.backdropHeight) {
      fDif = currentTNode.backdropHeight - currentFNode.backdropHeight;
    }

    let tDif = 0;
    if (currentFNode.cap > currentTNode.cap) {
      tDif = currentFNode.backdropHeight - currentTNode.backdropHeight;
    }

    // calc height difference between the extra nodes generated in case of a train having reached > 100% cap
    let fullPadding = 0;
    let fNodeFullPadding = 0;
    let tNodeFullPadding = 0;
    if (currentFNode.full || currentTNode.full) {
      fNodeFullPadding = currentFNode.nodeHeight - currentFNode.backdropHeight;
      tNodeFullPadding = currentTNode.nodeHeight - currentTNode.backdropHeight;
      fullPadding =
        Math.max(
          fNodeFullPadding + currentFNode.backdropHeight / 2, // halbieren der Höhe um den Mittelpunkt zu finden
          tNodeFullPadding + currentTNode.backdropHeight / 2
        ) -
        Math.max(
          currentFNode.backdropHeight / 2,
          currentTNode.backdropHeight / 2
        );
    }

    // Beginn des neuen Nodes ist das Ende des vorangegangen oder 0
    const y1_start =
      Math.max(
        tNodesFinished[Math.max(0, i - 1)].y1_backdrop || yPadding,
        fNodesFinished[Math.max(0, i - 1)].y1_backdrop || yPadding
      ) + fullPadding;

    // Start des neuen Backdrops ist das Ende des Vorgänger Knotens plus das Passing
    currentTNode.y0_backdrop =
      y1_start + (i === 0 ? 0 : nodePadding) + tDif / 2; // halbieren der Höhe um den Mittelpunkt zu finden
    // Ende des neuen Backdrops ist der Anfang plus die Knotenhöhe
    currentTNode.y1_backdrop =
      (currentTNode.y0_backdrop || 0) + (currentTNode.backdropHeight || 0);

    // Die y-Koordinaten beider Backdrops sind identisch
    currentFNode.y0_backdrop =
      y1_start + (i === 0 ? 0 : nodePadding) + fDif / 2; // halbieren der Höhe um den Mittelpunkt zu finden
    currentFNode.y1_backdrop =
      (currentFNode.y0_backdrop || 0) + (currentFNode.backdropHeight || 0);

    // Das untere Ende von Backdrop und dem eigentlich Knoten stimmen überein
    currentTNode.y1 = currentTNode.y1_backdrop;
    // Das obere Ende des eigentlichen Knotens ist das untere Ende plus die Knotenhöhe
    currentTNode.y0 = Math.max(
      (currentTNode.y1 || 0) - (currentTNode.nodeHeight || 0),
      0
    ); //currentTNode.y0_backdrop

    // Das gleiche nochmal für die linke Seite
    currentFNode.y1 = currentFNode.y1_backdrop;
    currentFNode.y0 = Math.max(
      (currentFNode.y1 || 0) - (currentFNode.nodeHeight || 0),
      0
    ); //currentFNode.y0_backdrop

    currentFNode.x0 = timeOffset;
    currentFNode.x1 = nodeWidth + timeOffset;

    currentTNode.x0 = width - nodeWidth - timeOffset;
    currentTNode.x1 = width - timeOffset;

    tNodesFinished[i] = currentTNode;
    fNodesFinished[i] = currentFNode;

    finalHeight = currentFNode.y0;
  }

  onSvgResize(finalHeight + yPadding); // set height of svg to the bottom of the last node + 10

  // #####################################################################################
  // Berechnung der Links für diesen Knoten, ggf später auslagern.
  // #####################################################################################

  const calculatedLinks: Link[] = [];

  for (const cNode of fNodesFinished) {
    const fNodeId = cNode.id;

    const currentLinks = [...links.filter((a) => sameId(a.fNId, fNodeId))].sort(
      (a, b) => {
        if (
          indexOfTripId(nodeIdArray, a.tNId) >
          indexOfTripId(nodeIdArray, b.tNId)
        )
          return -1;
        if (
          indexOfTripId(nodeIdArray, a.tNId) <
          indexOfTripId(nodeIdArray, b.tNId)
        )
          return 1;
        else return 0;
      }
    );
    // .reverse();

    let offset = 0;
    for (const i in currentLinks) {
      const cLink: Link = currentLinks[i];
      const width = calcNodeHeight(cLink.value, minNodeHeight, factor);
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
    const currentLinks = [
      ...calculatedLinks.filter((a) => sameId(a.tNId, tNodeId)),
    ].sort((a, b) => {
      if (
        indexOfTripId(nodeIdArray, a.fNId) > indexOfTripId(nodeIdArray, b.fNId)
      )
        return -1;
      if (
        indexOfTripId(nodeIdArray, a.fNId) < indexOfTripId(nodeIdArray, b.fNId)
      )
        return 1;
      else return 0;
    });

    let offset = 0;
    for (const i in currentLinks) {
      const cLink: Link = currentLinks[i];
      const l: Link = {
        ...cLink,
        y1: (cNode.y1 || 0) - offset - (cLink.width || 0) / 2,
      };
      offset += cLink.width || 0;
      if (cLink.width) {
        // Ziel bestimmt die Farbe der Knoten
        // currentLink.color = currentNode.color;
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
