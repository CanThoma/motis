import { format, interpolateRainbow, reduce, scaleLinear } from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  NodeMinimal,
  LinkMinimal,
  stationGraphDefault,
  createGraphInterface,
} from "./SankeyStationTypes";
import { TripId } from "../api/protocol/motis";

export default class StationUtils {
  static tripIdCompare = (a: TripId, b: TripId) => {
    return (
      a.station_id === b.station_id &&
      a.train_nr === b.train_nr &&
      a.time === b.time &&
      a.target_station_id === b.target_station_id &&
      a.line_id === b.line_id &&
      a.target_time === b.target_time
    );
  };

  static sameId = (a: TripId | string, b: TripId | string) => {
    if (typeof a !== "string" && typeof b !== "string")
      return this.tripIdCompare(a, b);
    if (typeof a !== typeof b) return false;
    else return a === b;
  };

  static getNodeValue = <K extends keyof NodeMinimal>(
    nodes: NodeMinimal[],
    id: string,
    selector: K
  ) => {
    return nodes.filter((node: NodeMinimal) => node.id === id)[0][selector];
  };

  static getNode = (nodes: NodeMinimal[], id: string | TripId) => {
    return nodes.filter((node) => this.sameId(node.id, id))[0];
  };

  static colour = (value: number): string => {
    return interpolateRainbow(value);
  };

  /**
   * Berechnet die relative Höhe eines Knotens basierend auf dem
   * Gesamtvalue (= gesamte Passagieranzahl),
   * dem Knotenvalue (= Passagiere am jeweiligen Bahnhof)
   * und der effektiv nutzbaren Höhe (= Gesamthöhe - NodePadding * (NodeCount - 1))
   */
  static calcNodeHeight = (
    nodeValue: number,
    minHeight: number,
    factor = 4
  ): number => {
    if (nodeValue <= 0) return 0;
    const calcHeight = this.calcNodeHeightWithoutMinHeight(nodeValue, factor);
    if (calcHeight <= minHeight) return minHeight;
    return calcHeight;
  };

  static calcNodeHeightWithoutMinHeight = (
    value: number,
    factor = 4
  ): number => {
    return value / factor;
  };

  /**
   * Konvertiert einen Link in einen Pfad-String
   */

  static formatTextTime = (n: Node) => {
    const nodeArrivalTime = n.time;
    const aDate = new Date(nodeArrivalTime * 1000);
    const aHour =
      aDate.getHours() < 10 ? "0" + aDate.getHours() : aDate.getHours();
    const aMinute =
      aDate.getMinutes() < 10 ? "0" + aDate.getMinutes() : aDate.getMinutes();
    return aHour + ":" + aMinute + " Uhr";
  };
  static formatTextNode = (name: string, node: Node): string => {
    return `${name}\n${node.pax} Passagiere \nKapazität: ${node.cap} `;
  };
  static formatTextLink = (
    fNodeName: string,
    tNodeName: string,
    link: Link
  ): string => {
    return `${link.value} Personen \n ${
      fNodeName.includes("\u2192")
        ? fNodeName.substr(0, fNodeName.indexOf(" \u2192"))
        : fNodeName
    } \u2192 ${
      tNodeName.includes("\u2192")
        ? tNodeName.substr(0, tNodeName.indexOf(" \u2192"))
        : tNodeName
    }}`;
  };

  static createSankeyLink = (
    nodeWidth: number,
    width: number,
    y0: number,
    y1: number
  ): string => {
    // +++++++++ Kurz +++++++++
    // Beispielpfad: d="M20,461.58662092624354C300,461.58662092624354,300,337.6243567753003,580,337.6243567753003"
    // Das Muster ist folgendes:
    // M nodeWidth, y0 C Width/2, y0 , Width/2, y1, Width-nodeWidth, y1

    /* ++++++ Ausführlich +++++
    M (x,y) = Move the current point to the coordinate x,y. Any subsequent coordinate pair(s) are interpreted as parameter(s) for implicit absolute LineTo (L) command(s) (see below).
    C ((x1,y1, x2,y2, x,y)+= Draw a cubic Bézier curve from the current point to the end point specified by x,y. The start control point is specified by x1,y1 and the end control point is specified by x2,y2. Any subsequent triplet(s) of coordinate pairs are interpreted as parameter(s) for implicit absolute cubic Bézier curve (C) command(s).
     */
    return `M${nodeWidth + 70},${y0}C${width / 2},${y0},${width / 2},${y1},${
      width - nodeWidth - 70
    },${y1}`;
  };

  static createNode = (
    id: string,
    name: string,
    pax: number,
    cap: number,
    time: number
  ): Node => {
    return {
      id,
      name,
      pax,
      cap,
      time,
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
    };
  };

  /**
   * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
   */
  static createGraph = ({
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

    const timeOffset = 70;
    const minNodeHeight = 2;

    // #####################################################################################
    // Berechnung der Nodes
    // #####################################################################################

    // fügt previous node zu falls umsteiger existieren und gibt ihr die farbe

    const prNode: Node = {
      ...this.getNode(fNodes, "previous"),
      colour: prPaxColour,
    };

    if (prNode.pax > 0) {
      fNodesFinished.push({ ...prNode, name: "previous" });
      tNodesFinished.push({ ...prNode, pax: 0 });
    }

    // fügt boarding node zu falls umsteiger existieren und gibt ihr die farbe

    const boNode: Node = {
      ...this.getNode(fNodes, "boarding"),
      colour: boPaxColour,
    };

    if (boNode.pax > 0) {
      fNodesFinished.push({ ...boNode, name: "boarding" });
      tNodesFinished.push({ ...boNode, pax: 0 });
    }

    // fügt reguläre Nodes hinzu un bereitet daten vor
    // beginnt nach previous und board node

    for (const cNode of fNodes) {
      if (typeof cNode.id === "string") continue;

      fNodesFinished.push({
        ...cNode,
        name:
          cNode.name.substr(0, cNode.name.indexOf(" (")) +
          " \u2192 " +
          cNode.name.substr(
            cNode.name.indexOf(" - ") + 2,
            cNode.name.length - cNode.name.indexOf(" - ") - 3
          ),
        full: cNode.cap < cNode.pax,
      });
      tNodesFinished.push({
        ...cNode,
        pax: 0,
        full: false,
      });
    }

    const indexOfTripId = (
      idArray: (string | TripId)[],
      id: string | TripId
    ) => {
      return idArray.findIndex((idX) => StationUtils.sameId(idX, id));
    };

    for (const cNode of tNodes) {
      if (typeof cNode.id === "string") continue;

      const tempArray = fNodesFinished.filter((n) =>
        this.sameId(cNode.id, n.id)
      );
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
        tNodesFinished.push({
          ...cNode,
          name:
            cNode.name.substr(0, cNode.name.indexOf(" (")) +
            " \u2192 " +
            cNode.name.substr(
              cNode.name.indexOf(" - ") + 2,
              cNode.name.length - cNode.name.indexOf(" - ") - 3
            ),
          full: cNode.cap < cNode.pax,
        });
      }
    }

    // fügt exiting node zu falls umsteiger existieren und gibt ihr die farbe

    const exNode: Node = {
      ...this.getNode(tNodes, "exiting"),
      colour: exPaxColour,
    };

    if (exNode.pax > 0) {
      fNodesFinished.push({ ...exNode, pax: 0 });
      tNodesFinished.push({ ...exNode, name: "exit" });
    }

    // fügt future node zu falls umsteiger existieren und gibt ihr die farbe

    const fuNode: Node = {
      ...this.getNode(tNodes, "future"),
      colour: fuPaxColour,
    };

    if (fuNode.pax > 0) {
      fNodesFinished.push({ ...fuNode, pax: 0 });
      tNodesFinished.push({ ...fuNode, name: "future" });
    }

    // sort nodes by arival time first, then by departure time

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
        colour: this.colour((Number(i) + 1) / fNodesFinished.length),
      };
      tNodesFinished[i] = {
        ...tNodesFinished[i],
        colour: this.colour((Number(i) + 1) / tNodesFinished.length),
      };
    }

    // Berechnen der Höhe der Nodes und Zuweisung der entsprechenden Koordinaten.

    let finalHeight = 0;

    for (let i = 0; i < tNodesFinished.length; i++) {
      const currentTNode = tNodesFinished[i];
      const currentFNode = fNodesFinished[i];

      if (!(currentFNode && currentTNode)) continue;

      currentTNode.backdropHeight = this.calcNodeHeightWithoutMinHeight(
        currentTNode.cap,
        factor
      );
      currentFNode.backdropHeight = this.calcNodeHeightWithoutMinHeight(
        currentFNode.cap,
        factor
      );

      currentTNode.nodeHeight = this.calcNodeHeightWithoutMinHeight(
        currentTNode.pax,
        factor
      );
      currentFNode.nodeHeight = this.calcNodeHeightWithoutMinHeight(
        currentFNode.pax,
        factor
      );

      // vergrößere Nodes falls links wegen minimaler link größe vergrößert wurden

      const currentFLinks = links.filter((a) =>
        this.sameId(a.fNId, currentFNode.id)
      );
      for (const cLink of currentFLinks) {
        if (
          this.calcNodeHeightWithoutMinHeight(cLink.value, factor) <
          minNodeHeight
        ) {
          const heightDiff =
            this.calcNodeHeight(cLink.value, minNodeHeight, factor) -
            this.calcNodeHeightWithoutMinHeight(cLink.value, factor);
          currentFNode.backdropHeight += heightDiff;
          currentFNode.nodeHeight += heightDiff;
          currentTNode.backdropHeight += heightDiff;
        }
      }

      const currentTLinks = links.filter((a) =>
        this.sameId(a.tNId, currentTNode.id)
      );
      for (const cLink of currentTLinks) {
        if (
          this.calcNodeHeightWithoutMinHeight(cLink.value, factor) <
          minNodeHeight
        ) {
          const heightDiff =
            this.calcNodeHeight(cLink.value, minNodeHeight, factor) -
            this.calcNodeHeightWithoutMinHeight(cLink.value, factor);
          currentTNode.backdropHeight += heightDiff;
          currentTNode.nodeHeight += heightDiff;
          currentFNode.backdropHeight += heightDiff;
        }
      }

      // TODO
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
        fNodeFullPadding =
          currentFNode.nodeHeight - currentFNode.backdropHeight;
        tNodeFullPadding =
          currentTNode.nodeHeight - currentTNode.backdropHeight;
        fullPadding =
          Math.max(
            fNodeFullPadding + currentFNode.backdropHeight / 2,
            tNodeFullPadding + currentTNode.backdropHeight / 2
          ) -
          Math.max(
            currentFNode.backdropHeight / 2,
            currentTNode.backdropHeight / 2
          );
      }

      // Beginn des neuen Nodes ist das Ende des vorrangegangen oder 0
      const y1_start =
        Math.max(
          tNodesFinished[Math.max(0, i - 1)].y1_backdrop || 5,
          fNodesFinished[Math.max(0, i - 1)].y1_backdrop || 5
        ) + fullPadding;

      // Start des neuen Backdrops ist das Ende des Vorgänger Knotens plus das Passing
      currentTNode.y0_backdrop =
        y1_start + (i === 0 ? 0 : nodePadding) + tDif / 2;
      // Ende des neuen Backdrops ist der Anfang plus die Knotenhöhe
      currentTNode.y1_backdrop =
        (currentTNode.y0_backdrop || 0) + (currentTNode.backdropHeight || 0);

      // Die y-Koordinaten beider Backdrops sind identisch
      currentFNode.y0_backdrop =
        y1_start + (i === 0 ? 0 : nodePadding) + fDif / 2;
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
      currentFNode.x1 = 0 + nodeWidth + timeOffset;

      currentTNode.x0 = width - nodeWidth - timeOffset;
      currentTNode.x1 = width - timeOffset;

      tNodesFinished[i] = currentTNode;
      fNodesFinished[i] = currentFNode;

      finalHeight = currentFNode.y0;
    }

    onSvgResize(finalHeight + 10); // set height of svg to the bottom of the last node + 20

    // #####################################################################################
    // Berechnung der Links für diesen Knoten, ggf später auslagern.
    // #####################################################################################

    const calculatedLinks: Link[] = [];

    for (const cNode of fNodesFinished) {
      const fNodeId = cNode.id;

      const currentLinks = [
        ...links.filter((a) => this.sameId(a.fNId, fNodeId)),
      ].sort((a, b) => {
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
      });
      // .reverse();

      let offset = 0;
      for (const i in currentLinks) {
        const cLink: Link = currentLinks[i];
        const width = this.calcNodeHeight(cLink.value, minNodeHeight, factor);
        const l: Link = {
          ...cLink,
          width: width,
          y0: (cNode.y1 || 0) - offset - width / 2,
          colour: cNode.colour,
        };
        offset += width;

        calculatedLinks.push(l);
      }
    }

    const finishedLinks: Link[] = [];

    for (const cNode of tNodesFinished) {
      const tNodeId = cNode.id;
      const currentNodeIndex = fNodesFinished.findIndex((n) =>
        this.sameId(n.id, tNodeId)
      );
      const currentLinks = [
        ...calculatedLinks.filter((a) => this.sameId(a.tNId, tNodeId)),
      ].sort((a, b) => {
        if (
          indexOfTripId(nodeIdArray, a.fNId) >
          indexOfTripId(nodeIdArray, b.fNId)
        )
          return -1;
        if (
          indexOfTripId(nodeIdArray, a.fNId) <
          indexOfTripId(nodeIdArray, b.fNId)
        )
          return 1;
        else return 0;
      });
      //.reverse();

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
          // currentLink.colour = currentNode.colour;
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
}
