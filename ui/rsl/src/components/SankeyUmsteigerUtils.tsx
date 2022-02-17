import { interpolateRainbow} from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  NodeMinimal,
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

    const tNodesFinished:Node[] = [];
    const fNodesFinished:Node[] = [];
    const finishedLinks:Link[] = [];

    return {
      toNodes: tNodesFinished,
      fromNodes: fNodesFinished,
      links: finishedLinks,
    };
  };
}
