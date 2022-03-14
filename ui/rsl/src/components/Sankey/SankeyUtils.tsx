import { Link, Node, NodeMinimal } from "./StationGraph/SankeyStationTypes";
import { TripId } from "../../api/protocol/motis";
import { interpolateRainbow } from "d3";
import { timeOffset } from "../../config";

/**
 * Erstellt einen Daten string zur Darstellung der Ankunfts- und Abfahrtszeit der Züge
 * @param n Node
 */

export const formatTextTime = (n: Node): string => {
  const nodeArrivalTime = n.time;
  const aDate = new Date(nodeArrivalTime * 1000);
  const aHour =
    aDate.getHours() < 10 ? "0" + aDate.getHours() : aDate.getHours();
  const aMinute =
    aDate.getMinutes() < 10 ? "0" + aDate.getMinutes() : aDate.getMinutes();
  return aHour + ":" + aMinute + " Uhr";
};

/**
 * gibt die erste node mit gegebener Id zurück
 * @param nodes Node Array
 * @param id eine id, kann string sein wegen "previous" etc
 */
export const getNode = (nodes: NodeMinimal[], id: string | TripId): Node => {
  for (const cNode of nodes) {
    if (sameId(cNode.id, id)) return cNode;
  }
  return nodes[0];
};

/**
 * vergleicht 2 tripIds abhängig von jedem Feld
 * benötigt um nach TripId sortieren zu können
 * @param a erste Trip Id
 * @param b zweite Trip Id
 */
export const tripIdCompare = (a: TripId, b: TripId) => {
  return (
    a.station_id === b.station_id &&
    a.train_nr === b.train_nr &&
    a.time === b.time &&
    a.target_station_id === b.target_station_id &&
    a.line_id === b.line_id &&
    a.target_time === b.target_time
  );
};

/**
 * Vergleicht zwei Ids, können auch string sein wegen "previous" etc
 * benötigt um nach Id zu sortieren
 * @param a erste id
 * @param b zweite id
 */
export const sameId = (a: TripId | string, b: TripId | string): boolean => {
  if (typeof a !== "string" && typeof b !== "string")
    return tripIdCompare(a, b);
  if (typeof a !== typeof b) return false;
  else return a === b;
};

/**
 * berechnet die Farbe der Node aus der Position der Node im array
 * alle colourIntervallLength wiederholen sich die Farben für bessere Lesbarkeit
 * @param i index der node
 * @param n Länge des Array
 */
export const color = (i: number, n: number): string => {
  const colourIntervallLength = 15;
  return interpolateRainbow(
    ((Number(i) + 1) % colourIntervallLength) /
      Math.min(n, colourIntervallLength)
  );
};

/**
 * Erstellt den Text der den Titel beim hovern der Links füllt
 * @param fNodeName
 * @param tNodeName
 * @param link
 */
export const formatTextLink = (
  fNodeName: string,
  tNodeName: string,
  link: Link
): string => {
  return `${link.value} Personen \n${
    fNodeName.includes("\u2192")
      ? fNodeName.substr(0, fNodeName.indexOf(" \u2192"))
      : fNodeName
  } \u2192 ${
    tNodeName.includes("\u2192")
      ? tNodeName.substr(0, tNodeName.indexOf(" \u2192"))
      : tNodeName
  }`;
};

/**
 *
 * @param cNode
 */
export const minimalToNode = (cNode: Node): Node => {
  return {
    ...cNode,
    name:
      cNode.name.substr(0, cNode.name.indexOf(" (")) +
      " \u2192 " +
      cNode.name.substr(
        cNode.name.indexOf(" - ") + 2,
        cNode.name.length - cNode.name.indexOf(" - ") - 3
      ),
    full: cNode.cap < cNode.pax,
  };
};

/**
 * +++++++++ Kurz +++++++++
 * Beispielpfad: d="M20,461.58662092624354C300,461.58662092624354,300,337.6243567753003,580,337.6243567753003"
 * Das Muster ist folgendes:
 * M nodeWidth, y0 C Width/2, y0 , Width/2, y1, Width-nodeWidth, y1
 *
 * ++++++ Ausführlich +++++
 * M (x,y) = Move the current point to the coordinate x,y. Any subsequent coordinate pair(s) are interpreted as parameter(s) for implicit absolute LineTo (L) command(s) (see below).
 * C ((x1,y1, x2,y2, x,y)+= Draw a cubic Bézier curve from the current point to the end point specified by x,y. The start control point is specified by x1,y1 and the end control point is specified by x2,y2. Any subsequent triplet(s) of coordinate pairs are interpreted as parameter(s) for implicit absolute cubic Bézier curve (C) command(s).
 *
 * @param nodeWidth Basisbreite der Nodes
 * @param width Basisbreite des Graphen
 * @param y0 y Koordinate der linken Node
 * @param y1 y Koordinate der rechten Node
 */
export const createSankeyLink = (
  nodeWidth: number,
  width: number,
  y0: number,
  y1: number
): string => {
  return `M${nodeWidth + timeOffset},${y0}C${width / 2},${y0},${
    width / 2
  },${y1},${width - nodeWidth - timeOffset},${y1}`;
};
