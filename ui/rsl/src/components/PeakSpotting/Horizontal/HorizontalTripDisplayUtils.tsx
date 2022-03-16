import { interpolateRgb, scaleLinear } from "d3";
import { colorSchema, peakSpottingConfig as config } from "../../../config";
import { PaxMonFilteredTripInfo } from "../../../api/protocol/motis/paxmon";
import { initCommonEdgeInfo, TripEdge } from "../TripDisplayUtils";

/**
 * Der Grundgedanke ist den prozentualen Anteil der Zeit
 * zu errechnen, um damit die x-Achsen variable zu errechnen
 * und damit das Rechteck zu zeichnen.
 * @param hours
 * @param minutes
 */
const calcTimePercentage = (hours: number, minutes: number): number => {
  return hours / config.timeFrame + minutes / (60 * config.timeFrame);
};

/**
 * berechnet die x Koordinate einer Kante
 * @param width breite des Graphen
 * @param hours
 * @param minutes
 */
const calcXCoordinate = (
  width: number,
  hours: number,
  minutes: number
): number => {
  const percentage = calcTimePercentage(hours, minutes);
  return width * percentage;
};

/**
 * Berechnet die Breite eines Trips abhängig von Abfahrts- und Ankunftszeit
 * @param width Breite des Graphen
 * @param departureHours
 * @param departureMinutes
 * @param arrivalHours
 * @param arrivalMinutes
 */
const calcTripWidth = (
  width: number,
  departureHours: number,
  departureMinutes: number,
  arrivalHours: number,
  arrivalMinutes: number
): number => {
  const x1 = width * calcTimePercentage(arrivalHours, arrivalMinutes);
  const x2 = width * calcTimePercentage(departureHours, departureMinutes);
  return x1 - x2;
};

/**
 * Setzt die x Koordinate und die Breite der Edge
 * @param width Breite des Graphen
 * @param edge
 */
const addXAndWidth = (width: number, edge: TripEdge): TripEdge => {
  if (
    !edge.departureHours ||
    !edge.departureMinutes ||
    !edge.arrivalHours ||
    !edge.arrivalMinutes
  )
    return edge;

  edge.x = calcXCoordinate(width, edge.departureHours, edge.departureMinutes);
  edge.horizontalWidth = calcTripWidth(
    width,
    edge.departureHours,
    edge.departureMinutes,
    edge.arrivalHours,
    edge.arrivalMinutes
  );
  return edge;
};

/**
 * Übergebene tripinfos werden als Gesamtkatalog interpretiert und gibt daraus eine Subsektion aus pageNumber und pageSize an
 * @param items
 * @param pageNumber
 * @param pageSize
 */
const paginate = (
  items: PaxMonFilteredTripInfo[] | undefined,
  pageNumber: number,
  pageSize: number
): PaxMonFilteredTripInfo[] => {
  if (!items) return [];
  const startIndex = (pageNumber - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};

type prepareEdgesProps = {
  trip: PaxMonFilteredTripInfo;
  width: number;
  height: number;
};

/**
 * Bereitet die Daten der Edges so auf das sie gezeichnet werden können.
 * Berechnet Koordinaten und Breiten der Edges abhängig von der Dauer einer Fahrt.
 * @param trip
 * @param width Breite des Graphen
 * @param height Höhe des Graphen
 */
const prepareEdges = ({
  trip,
  width,
  height,
}: prepareEdgesProps): TripEdge[] => {
  const finalEdges = [];

  for (const edge of trip.edges) {
    let [tmpEdge, leftValue, rightValue] = initCommonEdgeInfo(edge);
    leftValue *= config.temporaryLeftSideScalarBecauseNoProbabilityData;

    // Muss ne Zahl zwischen 0 u 1 sein
    tmpEdge.color = color(Math.min(1, rightValue / edge.capacity));

    // Höhe berechnen
    tmpEdge.capHeight = edge.capacity / config.horizontalCapacityScale;
    tmpEdge.height = rightValue / config.horizontalCapacityScale;

    tmpEdge.y = height - rightValue / config.horizontalCapacityScale;

    let overflowTmpEdge = null;

    // Haben wir nen overflow?
    if (tmpEdge.capacity < rightValue) {
      overflowTmpEdge = { ...tmpEdge };

      tmpEdge.y = height - tmpEdge.capacity / config.horizontalCapacityScale;
      tmpEdge.height = tmpEdge.capacity / config.horizontalCapacityScale;

      overflowTmpEdge.height = Math.max(
        0,
        (rightValue - tmpEdge.capacity) / config.horizontalCapacityScale - 1.5
      );
      overflowTmpEdge.y = Math.max(
        0,
        height - tmpEdge.height - overflowTmpEdge.height - 1.5
      );
    }

    // z.B. 23:00 abgefahren und 00:30 angekommen
    if (tmpEdge.departureHours > tmpEdge.arrivalHours) {
      // kopiere die erste Strecke, sodass der zeitliche Überlauf
      // wieder von links (0:00Uhr) anfängt.
      let timeWrapOverflowTmpEdge = null;
      if (overflowTmpEdge) {
        timeWrapOverflowTmpEdge = { ...overflowTmpEdge };
      }

      let timeWrapTmpEdge = { ...tmpEdge };

      tmpEdge.arrivalHours = 24;
      tmpEdge.arrivalMinutes = 0;

      if (overflowTmpEdge) {
        overflowTmpEdge.arrivalHours = 24;
        overflowTmpEdge.arrivalMinutes = 0;
      }
      timeWrapTmpEdge.departureHours = 0;
      timeWrapTmpEdge.departureMinutes = 0;

      timeWrapTmpEdge = addXAndWidth(width, { ...timeWrapTmpEdge });

      if (timeWrapOverflowTmpEdge) {
        timeWrapOverflowTmpEdge.departureMinutes = 0;
        timeWrapOverflowTmpEdge.departureHours = 0;
        timeWrapOverflowTmpEdge = addXAndWidth(width, {
          ...timeWrapOverflowTmpEdge,
        });
        finalEdges.push(timeWrapOverflowTmpEdge);
      }
      finalEdges.push(timeWrapTmpEdge);
    }

    if (overflowTmpEdge) {
      overflowTmpEdge = addXAndWidth(width, { ...overflowTmpEdge });
      finalEdges.push(overflowTmpEdge);
      overflowTmpEdge = null;
    }

    tmpEdge.x = calcXCoordinate(
      width,
      tmpEdge.departureHours,
      tmpEdge.departureMinutes
    );

    tmpEdge.horizontalWidth = calcTripWidth(
      width,
      tmpEdge.departureHours,
      tmpEdge.departureMinutes,
      tmpEdge.arrivalHours,
      tmpEdge.arrivalMinutes
    );

    const tmpEdge2 = { ...tmpEdge };
    tmpEdge2.height = leftValue / config.horizontalCapacityScale;

    tmpEdge2.y = height - leftValue / config.horizontalCapacityScale;
    tmpEdge2.color = colorSchema.black;
    tmpEdge2.noCap = true;
    tmpEdge2.opacity = 0.45;

    finalEdges.push(tmpEdge);
    finalEdges.push(tmpEdge2);
  }

  return finalEdges;
};

const color = scaleLinear<string>()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

const formatTime = (time: Date): string => {
  const h = time.getHours();
  const m = time.getMinutes();

  const hh = h < 10 ? "0" + h : h;
  const mm = m < 10 ? "0" + m : m;

  return `${hh}:${mm}Uhr`;
};

const formatEdgeInfo = (edge: TripEdge): string => {
  if (!edge.departureTime || !edge.arrivalTime) return "";
  return `${edge.from.name} \u279E ${edge.to.name}\n${formatTime(
    edge.departureTime
  )}  \u279E ${formatTime(edge.arrivalTime)}\n\n${
    edge.expected_passengers
  } erwartete Passagiere\n${edge.capacity} Kapazität`;
};

export { prepareEdges, calcTripWidth, formatEdgeInfo, paginate };
