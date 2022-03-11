import { Node } from "./SankeyStationTypes";
import { TripId } from "../api/protocol/motis";

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
 *
 * @param cNode
 */
export const expandNode = (cNode: Node): Node => {
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
