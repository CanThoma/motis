import { interpolateRainbow} from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  NodeMinimal,
  LinkMinimal,
  createGraphInterface
} from "./SankeyStationTypes";
import { TripId } from "../api/protocol/motis";

export default class UmsteigerUtils {
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
  static calcNodeHeight = (nodeValue: number, minHeight: number): number => {
    if (nodeValue <= 0) return 0;
    const calcHeight = this.calcNodeHeightWithoutMinHeight(nodeValue);
    if (calcHeight <= minHeight) return minHeight;
    return calcHeight;
  };

  static calcNodeHeightWithoutMinHeight = (value: number): number => {
    return value / 4;
  };

  /**
   * Konvertiert einen Link in einen Pfad-String
   */

  static formatTextTime = (n: Node) => {
    const nodeArrivalTime = n.time;
    const aDate = new Date(nodeArrivalTime * 1000);
    const aHour = aDate.getHours()<10?"0"+aDate.getHours():aDate.getHours()
    const aMinute = aDate.getMinutes()<10?"0"+aDate.getMinutes():aDate.getMinutes();
    return aHour+":"+aMinute+" Uhr";
  };
  static formatTextNode = (name: string, node: Node): string => {
    return `${name}\n${node.pax} Personen Steigen um. \nMax. Kapazität: ${node.cap} `;
  };
  static formatTextLink = (
    fNodeName: string,
    tNodeName: string,
    link: Link
  ): string => {
    return `${link.value} Personen \n ${fNodeName.includes("\u2192")?fNodeName.substr(0,fNodeName.indexOf(" \u2192")):fNodeName} \u2192 ${tNodeName.includes("\u2192")?tNodeName.substr(0,tNodeName.indexOf(" \u2192")):tNodeName}}`;
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
    return `M${nodeWidth+50},${y0}C${width / 2},${y0},${width / 2},${y1},${
      width - nodeWidth-50
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
                        }: createGraphInterface
  ): SankeyInterface => {

    let tNodesFinished:Node[] = [];
    let fNodesFinished:Node[] = [];

    const prPaxColour = "#f20544";
    const boPaxColour = "#f27e93";
    const exPaxColour = "#f27e93";
    const fuPaxColour = "#f20544";


    const minNodeHeight = 2.5;

    // fügt previous node zu falls umsteiger existieren und gibt ihr die farbe

    const prNode: Node = {
      ...this.getNode(fNodes, "previous"),
      colour: prPaxColour,
    };

    if (prNode.pax > 0) {
      fNodesFinished.push({ ...prNode, name: "previous" });
    }

    // fügt boarding node zu falls umsteiger existieren und gibt ihr die farbe

    const boNode: Node = {
      ...this.getNode(fNodes, "boarding"),
      colour: boPaxColour,
    };

    if (boNode.pax > 0) {
      fNodesFinished.push({ ...boNode, name: "boarding" });
    }

    // fügt reguläre Nodes hinzu un bereitet daten vor
    // beginnt nach previous und board node

    for (const  cNode of fNodes) {
      if (typeof cNode.id === "string") continue;

      fNodesFinished.push({
        ...cNode,
        name:
          cNode.name.substr(0, cNode.name.indexOf(" ("))
          + " \u2192 "
          + cNode.name.substr(cNode.name.indexOf(" - ") +2, cNode.name.length - cNode.name.indexOf(" - ")-3) ,
        full: cNode.cap < cNode.pax,
      });
    }

    for (const  cNode of tNodes) {
      if (typeof cNode.id === "string") continue;

      tNodesFinished.push({
        ...cNode,
        name:
          cNode.name.substr(0, cNode.name.indexOf(" ("))
          + " \u2192 "
          + cNode.name.substr(cNode.name.indexOf(" - ") +2, cNode.name.length - cNode.name.indexOf(" - ")-3) ,
        full: cNode.cap < cNode.pax,
      });
    }

    // fügt exiting node zu falls umsteiger existieren und gibt ihr die farbe

    const exNode: Node = {
      ...this.getNode(tNodes, "exiting"),
      colour: exPaxColour,
    };

    if (exNode.pax > 0) {
      tNodesFinished.push({ ...exNode, name: "exit" });
    }

    // fügt future node zu falls umsteiger existieren und gibt ihr die farbe

    const fuNode: Node = {
      ...this.getNode(tNodes, "future"),
      colour: fuPaxColour,
    };

    if (fuNode.pax > 0) {
      tNodesFinished.push({ ...fuNode, name: "future" });
    }

    // sort nodes by arival time first, then by departure time

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


    const calcColour = (nArray: Node[]) => {
      const calcNodes = [];
      for (const i in nArray) {
        const cNode = nArray[i];
        if (typeof cNode.id === "string") continue;
        calcNodes
          .push({...cNode,
          colour: this.colour((Number(i) + 1) / nArray.length)})
      };
      return calcNodes
    };

    fNodesFinished = calcColour(fNodesFinished);
    tNodesFinished = calcColour(tNodesFinished);

    // Berechnen der Höhe der Nodes.

    let finalHeight = 0;

    const assignHeight = (n:Node[]) => {
      const calcNodes = [];
      for (const cNode of n) {
        cNode.backdropHeight = this.calcNodeHeightWithoutMinHeight(
          cNode.cap
        );
        cNode.nodeHeight = this.calcNodeHeightWithoutMinHeight(
          cNode.pax
        );
        calcNodes.push(cNode);
      };
      return calcNodes;
    };

    fNodesFinished = assignHeight(fNodesFinished);
    tNodesFinished = assignHeight(tNodesFinished);

    // Falls einer der Links einer Node unter Minimum height ist muss auf die höhe der Node die differenz

    const addHeightDiff = <K extends keyof { fNId: TripId | string; tNId: TripId | string; }>(
      n:Node[],
      selector: K
    ) => {
      const calcNodes = [];
      for (const cNode of n) {
        if (!(cNode.backdropHeight && cNode.nodeHeight)) continue;

        const currentLinks = links.filter((a) =>
          this.sameId(a[selector], cNode.id)
        );
        for (const cLink of currentLinks) {
          if (this.calcNodeHeightWithoutMinHeight(cLink.value) < minNodeHeight) {
            const heightDiff =
              this.calcNodeHeight(cLink.value, minNodeHeight) -
              this.calcNodeHeightWithoutMinHeight(cLink.value);
            cNode.backdropHeight += heightDiff;
            cNode.nodeHeight += heightDiff;
          };
        };
        calcNodes.push(cNode);
      };
      return calcNodes;
    };

    fNodesFinished = addHeightDiff(fNodesFinished,"fNId");
    tNodesFinished = addHeightDiff(tNodesFinished,"tNId");

    // berechnen der koordinaten der Nodes

    const calcNodeXY = (nArray:Node[], x0:number, x1:number) => {
    const calcNodes: Node[] = [];
      for ( const i in nArray) {
        const cNode = nArray[i];
        if (!(cNode.backdropHeight && cNode.nodeHeight)) continue;


        // calc height difference between the nodes generated in case of a train having reached > 100% cap

        let diff = 0;
        if (cNode.backdropHeight < cNode.backdropHeight) {
          diff = cNode.backdropHeight - cNode.backdropHeight;
        };
        let fullPadding = 0;
        if (cNode.full) {
          fullPadding = cNode.nodeHeight - cNode.backdropHeight
        };

        const y1_start =
          (nArray[Math.max(0, Number(i) - 1)].y1_backdrop || 0) + fullPadding;

        cNode.y0_backdrop =
          y1_start + (Number(i) === 0 ? 0 : nodePadding) + diff / 2;
        cNode.y1_backdrop =
          cNode.y0_backdrop + cNode.backdropHeight;

        cNode.y1 = cNode.y1_backdrop;
        cNode.y0 = cNode.y1- cNode.nodeHeight;

        cNode.x1 = x1;
        cNode.x0 = x0;

        calcNodes.push(cNode);
        finalHeight = Math.max(finalHeight, cNode.y1)
      };
      return calcNodes;
    };

    fNodesFinished = calcNodeXY(fNodesFinished,50,nodeWidth + 50);
    tNodesFinished = calcNodeXY(tNodesFinished,width - nodeWidth - 50,width - 50);

    onSvgResize( finalHeight + 20); // set height of svg to the bottom of the last node + 20

    // berechnen der Links

    const calculatedLinks: Link[] = [];

    const indexOfTripId = (
      idArray: (string | TripId)[],
      id: string | TripId
    ) => {
      return idArray.findIndex((idX) => this.sameId(idX, id));
    };

    for (const cNode of fNodesFinished) {
      const fNodeId = cNode.id;

      const tempArray = tNodesFinished.map((n)=> n.id)
      const currentLinks = links.filter((a) =>
        this.sameId(a.fNId, fNodeId))
        .sort((a, b) =>  {
        if (
          indexOfTripId(tempArray, a.tNId) >
          indexOfTripId(tempArray, b.tNId)
        )
          return -1;
        if (
          indexOfTripId(tempArray, a.tNId) <
          indexOfTripId(tempArray, b.tNId)
        )
          return 1;
        else return 0;
      });

      let offset = 0;
      for (const i in currentLinks) {
        const cLink: Link = currentLinks[i];
        const width = this.calcNodeHeight(cLink.value, minNodeHeight);
        const l: Link = {
          ...cLink,
          width: width,
          y0: (cNode.y1 || 0) - offset - width / 2,
          colour: cNode.colour,
        };
        offset += width;

        calculatedLinks.push(l);
      }
    };

    const finishedLinks: Link[] = [];

    for (const cNode of tNodesFinished) {
      const tNodeId = cNode.id;
      const currentLinks = calculatedLinks.filter((a) => this.sameId(a.tNId, tNodeId)).reverse();

      let offset = 0;
      for (const i in currentLinks) {
        const cLink: Link = currentLinks[i];
        const l: Link = {
          ...cLink,
          y1: (cNode.y1 || 0) - offset - (cLink.width || 0) / 2,
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
}
